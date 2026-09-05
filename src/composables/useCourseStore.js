import { reactive, ref, watch } from 'vue';
import { notifyExportStateChanged } from '@/composables/useTrackerExport';
const STORAGE_KEY = 'course-criteria-data';
function emptyCourse() {
    return {
        courseTitle: '',
        courseCode: '',
        courseYear: '',
        coursework: [],
        units: []
    };
}
function createCourseworkId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return `coursework-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function normalizeCourseSchema(course) {
    if (!course || typeof course !== 'object') {
        return course;
    }
    if (!Array.isArray(course.coursework)) {
        course.coursework = [];
    }
    const courseworkByKey = new Map();
    const addCoursework = (name, confirmed, date, type) => {
        const key = JSON.stringify([name, confirmed, date, type]);
        if (!courseworkByKey.has(key)) {
            const coursework = {
                id: createCourseworkId(),
                name,
                confirmed,
                date,
                type
            };
            courseworkByKey.set(key, coursework);
            course.coursework.push(coursework);
        }
        return courseworkByKey.get(key).id;
    };
    const walkClaims = (unitList = []) => {
        for (const unit of unitList) {
            if (!unit || typeof unit !== 'object')
                continue;
            for (const section of unit.sections ?? []) {
                if (!section || typeof section !== 'object')
                    continue;
                for (const criterion of section.criteria ?? []) {
                    if (!criterion || typeof criterion !== 'object')
                        continue;
                    for (const claim of criterion.claims ?? []) {
                        if (!claim || typeof claim !== 'object')
                            continue;
                        const legacyCourseworkId = typeof claim.courseworkId === 'string' ? claim.courseworkId : null;
                        const name = typeof claim.evidence === 'string' ? claim.evidence.trim() : '';
                        const confirmed = Boolean(claim.confirmed);
                        const date = typeof claim.claimDate === 'string' ? claim.claimDate : null;
                        const type = typeof claim.source === 'string' ? claim.source : 'Written';
                        if (legacyCourseworkId) {
                            claim.courseworkId = legacyCourseworkId;
                        }
                        else if (name.length > 0 || date !== null || confirmed || typeof claim.source === 'string') {
                            const courseworkId = addCoursework(name, confirmed, date, type);
                            claim.courseworkId = courseworkId;
                        }
                        delete claim.evidence;
                        delete claim.claimDate;
                        delete claim.confirmed;
                        delete claim.source;
                    }
                }
            }
        }
    };
    walkClaims(course.units);
    return course;
}
function isValidCourseSchema(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const asAny = obj;
    if (typeof asAny.courseTitle !== 'string')
        return false;
    if (typeof asAny.courseCode !== 'string')
        return false;
    if (typeof asAny.courseYear !== 'string')
        return false;
    if (!Array.isArray(asAny.coursework))
        return false;
    if (!Array.isArray(asAny.units))
        return false;
    for (const coursework of asAny.coursework) {
        if (!coursework || typeof coursework !== 'object')
            return false;
        if (typeof coursework.id !== 'string' || typeof coursework.name !== 'string')
            return false;
        if (typeof coursework.confirmed !== 'boolean')
            return false;
        if (coursework.date !== null && typeof coursework.date !== 'string')
            return false;
        if (typeof coursework.type !== 'string')
            return false;
    }
    for (const unit of asAny.units) {
        if (!unit || typeof unit !== 'object')
            return false;
        if (typeof unit.id !== 'string' || typeof unit.learningOutcome !== 'string')
            return false;
        if (!Array.isArray(unit.sections))
            return false;
        for (const section of unit.sections) {
            if (!section || typeof section !== 'object')
                return false;
            if (typeof section.id !== 'string' || typeof section.learningOutcome !== 'string')
                return false;
            if (!Array.isArray(section.criteria))
                return false;
            for (const criterion of section.criteria) {
                if (!criterion || typeof criterion !== 'object')
                    return false;
                if (typeof criterion.id !== 'string' || typeof criterion.title !== 'string')
                    return false;
                if (!Array.isArray(criterion.guidance))
                    return false;
                if (!Array.isArray(criterion.claims))
                    return false;
                for (const claim of criterion.claims) {
                    if (!claim || typeof claim !== 'object')
                        return false;
                    if (typeof claim.id !== 'string' || typeof claim.courseworkId !== 'string')
                        return false;
                }
            }
        }
    }
    // optional rules validation
    if (asAny.rules != null) {
        if (typeof asAny.rules !== 'object')
            return false;
        const r = asAny.rules;
        if (r.perCriterion != null) {
            if (typeof r.perCriterion !== 'object')
                return false;
            if (typeof r.perCriterion.count !== 'number' || r.perCriterion.count < 0)
                return false;
        }
        if (r.perType != null) {
            if (typeof r.perType !== 'object')
                return false;
            if (r.perType.scope !== 'unit' && r.perType.scope !== 'section')
                return false;
            if (typeof r.perType.counts !== 'object')
                return false;
            for (const k of Object.keys(r.perType.counts)) {
                if (typeof r.perType.counts[k] !== 'number' || r.perType.counts[k] < 0)
                    return false;
            }
        }
        if (r.placement != null) {
            if (typeof r.placement !== 'object' || typeof r.placement.hasPlacement !== 'boolean')
                return false;
            for (const key of ['requiredPlacementHours', 'requiredPlacementClients']) {
                if (r.placement[key] != null && (typeof r.placement[key] !== 'number' || r.placement[key] < 0))
                    return false;
            }
        }
    }
    return true;
}
function isCourseEmpty(course) {
    return (!course ||
        (!course.courseTitle && !course.courseCode && !course.courseYear && course.units.length === 0));
}
function loadCourseFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = normalizeCourseSchema(JSON.parse(raw));
        return isValidCourseSchema(parsed) && !isCourseEmpty(parsed) ? parsed : null;
    }
    catch {
        return null;
    }
}
const storedCourse = loadCourseFromStorage();
const hasStoredCourse = ref(Boolean(storedCourse) && !isCourseEmpty(storedCourse));
const welcomeDialogVisible = ref(!hasStoredCourse.value);
const course = reactive(storedCourse ?? emptyCourse());
function saveCourse() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(course));
    notifyExportStateChanged();
    hasStoredCourse.value = !isCourseEmpty(course);
}
function replaceCourse(data) {
    course.courseTitle = data.courseTitle;
    course.courseCode = data.courseCode;
    course.courseYear = data.courseYear;
    course.coursework.splice(0, course.coursework.length, ...structuredClone(data.coursework ?? []));
    // copy units
    course.units.splice(0, course.units.length, ...structuredClone(data.units));
    // copy rules if present (structuredClone to break reactive links)
    if (data.rules !== undefined) {
        // @ts-ignore - rules is optional on course
        course.rules = structuredClone(data.rules);
    }
    else {
        // ensure rules is undefined if not provided
        // @ts-ignore
        delete course.rules;
    }
    saveCourse();
    welcomeDialogVisible.value = false;
}
function continueWithEmptyModel() {
    course.courseTitle = '';
    course.courseCode = '';
    course.courseYear = '';
    course.coursework.splice(0, course.coursework.length);
    course.units.splice(0, course.units.length);
    // remove any rules when continuing empty
    // @ts-ignore
    delete course.rules;
    welcomeDialogVisible.value = false;
}
watch(course, () => {
    if (course.courseTitle || course.courseCode || course.courseYear || course.units.length > 0) {
        saveCourse();
    }
}, { deep: true });
export function useCourseStore() {
    return {
        course,
        welcomeDialogVisible,
        hasStoredCourse,
        replaceCourse,
        continueWithEmptyModel
    };
}
//# sourceMappingURL=useCourseStore.js.map