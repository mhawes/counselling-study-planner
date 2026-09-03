import { reactive, ref, watch } from 'vue';
import { notifyExportStateChanged } from '@/composables/useTrackerExport';
const STORAGE_KEY = 'course-criteria-data';
function emptyCourse() {
    return {
        courseTitle: '',
        courseCode: '',
        courseYear: '',
        units: []
    };
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
    if (!Array.isArray(asAny.units))
        return false;
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
        const parsed = JSON.parse(raw);
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