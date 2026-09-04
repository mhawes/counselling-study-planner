<template>
  <q-page padding>
    <FireworksDisplay
      :active="isCourseComplete"
      title="Course complete!"
      message="Congratulations! You have completed all course criteria."
      dismiss-label="Close"
    />

    <q-fab
      class="course-actions-fab"
      icon="add"
      active-icon="close"
      color="primary"
      direction="up"
      label="Actions"
      :hide-label="$q.screen.lt.md"
      vertical-actions-align="right"
    >
      <q-fab-action
        color="accent"
        icon="send"
        label="Submit work"
        @click="openSubmitWorkDialog()"
      />
      <q-fab-action
        color="secondary"
        icon="visibility"
        label="View submitted work"
        @click="submittedWorkDialogVisible = true"
      />
    </q-fab>

    <q-drawer
      v-model="drawerOpen"
      :mini="drawerMini"
      show-if-above
      bordered
    >
      <q-list padding>
        <q-item v-if="!$q.screen.lt.md" clickable v-ripple @click="drawerMini = !drawerMini">
          <q-item-section avatar>
            <q-icon :name="drawerMini ? 'chevron_right' : 'chevron_left'" />
          </q-item-section>
        </q-item>
        <q-separator class="q-my-sm" />
        <q-item
          clickable
          v-ripple
          :active="activeMenuItem === 'overview'"
          active-class="bg-primary text-white"
          @click="selectNavigationItem('overview')"
        >
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section class="text-weight-medium">Course Criteria Overview</q-item-section>
        </q-item>
        <q-separator class="q-my-sm" />
        <q-item
          v-for="item in navigationItems.slice(1)"
          :key="item.value"
          clickable
          v-ripple
          :active="activeMenuItem === item.value"
          active-class="bg-primary text-white"
          @click="selectNavigationItem(item.value)"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>
          <q-item-section class="text-weight-medium">{{ item.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <div class="q-mb-md">
      <q-btn
        flat
        dense
        icon="menu"
        label="Course menu"
        class="lt-md"
        @click="drawerOpen = true"
      />
    </div>

    <div class="course-criteria-content">
      <div v-if="activeMenuItem === 'overview'" id="overview" class="q-mb-lg">
        <q-card class="q-mb-md">
          <q-card-section class="row items-center q-gutter-sm">
            <div class="col">
              <div class="text-h5">Course Criteria Tracker</div>
              <div class="text-subtitle2">Record criteria claims and track completion status for each unit.</div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row q-gutter-sm">
              <div class="col-12 col-sm-6 col-md-3">
                <q-input v-model="course.courseTitle" label="Course Title" dense />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <q-input v-model="course.courseCode" label="Course Code" dense />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <q-input v-model="course.courseYear" label="Course Year" dense placeholder="YYYY-YYYY" />
              </div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <div class="col">
                <div class="text-subtitle2">Overall progress</div>
                <q-linear-progress :value="overallProgressValue" color="primary" track-color="grey-3" />
              </div>
              <div class="col-1">
                <div class="text-subtitle2">{{ totalCountedClaims }} / {{ totalRequiredClaims }} ({{ Math.round(overallProgressValue * 100) }}%)</div>
              </div>
            </div>

            <div class="row items-center q-gutter-sm">
              <div class="col">
                <div class="text-subtitle2">Units Complete</div>
                <q-linear-progress :value="course.units.filter(unitComplete).length / course.units.length" color="secondary" track-color="grey-3" />
              </div>
              <div class="col-1">
                <div class="text-subtitle2">{{ course.units.filter(unitComplete).length }} / {{ course.units.length }} ({{ Math.round((course.units.filter(unitComplete).length / course.units.length) * 100) }}%)</div>
              </div>
            </div>

            <div class="row items-center q-gutter-sm">
              <div class="col">
                <div class="text-subtitle2">Sections Complete</div>
                <q-linear-progress :value="course.units.reduce((acc, unit) => acc + unit.sections.filter(sectionComplete).length, 0) / course.units.reduce((acc, unit) => acc + unit.sections.length, 0)" color="accent" track-color="grey-3" />
              </div>
              <div class="col-1">
                <div class="text-subtitle2">{{ course.units.reduce((acc, unit) => acc + unit.sections.filter(sectionComplete).length, 0) }} / {{ course.units.reduce((acc, unit) => acc + unit.sections.length, 0) }} ({{ Math.round((course.units.reduce((acc, unit) => acc + unit.sections.filter(sectionComplete).length, 0) / course.units.reduce((acc, unit) => acc + unit.sections.length, 0)) * 100) }}%)</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <div class="row justify-center q-mt-md">
          <div class="col-auto">
            <q-btn flat color="primary" label="View Criteria" @click="selectNavigationItem(navigationItems[1]?.value || 'overview')" />
          </div>
        </div>
      </div>

      <div v-else>
        <q-card class="q-mb-sm">
          <q-card-section>
            <div class="row q-gutter-xs items-center">
              <div class="col">
                <q-input v-model="searchQuery" label="Search criteria" dense clearable prepend-icon="search" />
              </div>
              <div class="col">
                <q-select
                  v-model="selectedUnitIds"
                  :options="unitOptions"
                  label="Filter by unit"
                  dense
                  multiple
                  use-chips
                  emit-value
                  map-options
                />
              </div>
              <div class="col">
                <q-select
                  v-model="selectedWorkEvidence"
                  :options="workEvidenceOptions"
                  label="Filter by work / evidence"
                  dense
                  clearable
                  emit-value
                  map-options
                />
              </div>
              <div class="col">
                <q-toggle v-model="showIncompleteOnly" label="Incomplete only" dense />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-scroll-area class="criteria-scroll-area">
          <div class="criteria-scroll-content">
            <div v-if="filteredUnits.length === 0" class="text-grey text-center q-pa-md">
              No criteria match your search.
            </div>

            <div v-for="unit in filteredUnits" :key="unit.id" class="q-mb-md" :id="unitAnchorId(unit.id)">
              <q-card>
                <q-card-section class="row items-center q-gutter-sm">
                  <div class="col">
                    <div class="text-h6">Unit {{ unit.id }}: {{ unit.learningOutcome }}</div>
                    <div class="text-caption">{{ unit.sections.length }} section(s)</div>
                  </div>
                  <div class="col-auto">
                    <q-chip :color="unitComplete(courseUnit(unit.id)) ? 'positive' : 'warning'" text-color="white">
                      {{ unitComplete(courseUnit(unit.id)) ? 'Complete' : 'Incomplete' }}
                    </q-chip>
                  </div>
                </q-card-section>
                <q-separator />
                <q-card-section v-if="perTypeScope === 'unit'">
                  <div class="row q-gutter-md">
                    <div class="col-9 col-md-3" v-for="source in requiredSources" :key="source">
                      <q-banner :color="unitSourceCount(courseUnit(unit.id), source) >= (course.rules?.perType?.counts?.[source] ?? 0) ? 'positive' : 'grey-3'" class="q-pa-sm">
                        <div class="text-body2">{{ source }}</div>
                        <q-chip :color="unitSourceCount(courseUnit(unit.id), source) >= (course.rules?.perType?.counts?.[source] ?? 0) ? getClaimSourceColour(source) : 'grey-9'" text-color="white">
                          {{ unitSourceCount(courseUnit(unit.id), source) }} / {{ course.rules?.perType?.counts?.[source] ?? 0 }} required
                        </q-chip>
                      </q-banner>
                    </div>
                  </div>
                </q-card-section>
                <q-separator />
                <q-card-section>
                  <div v-for="section in unit.sections" :key="section.id" class="q-mb-lg" :id="sectionAnchorId(unit.id, section.id)">
                    <div class="text-subtitle1">Section {{ section.id }}: {{ section.learningOutcome }}</div>

                    <div v-if="perTypeScope === 'section'">
                      <div class="row q-gutter-md q-mt-xs">
                        <div class="col-9 col-md-3" v-for="source in requiredSources" :key="source + section.id">
                          <q-banner :color="sectionSourceCount(courseSection(unit.id, section.id), source) >= (course.rules?.perType?.counts?.[source] ?? 0) ? 'positive' : 'grey-3'" class="q-pa-sm">
                            <div class="text-body2">{{ source }}</div>
                            <q-chip :color="sectionSourceCount(courseSection(unit.id, section.id), source) >= (course.rules?.perType?.counts?.[source] ?? 0) ? getClaimSourceColour(source) : 'grey-3'" text-color="white">
                              {{ sectionSourceCount(courseSection(unit.id, section.id), source) }} / {{ course.rules?.perType?.counts?.[source] ?? 0 }} required
                            </q-chip>
                          </q-banner>
                        </div>
                      </div>
                    </div>

                    <div class="text-caption q-mb-sm">{{ section.criteria.length }} criteria</div>
                    <div v-for="criterion in section.criteria" :key="criterion.id" class="q-mb-md">
                      <q-expansion-item
                        expand-separator
                        :label="criterion.id + ' – ' + criterion.title"
                        switch-toggle
                      >
                        <template #header>
                          <div class="row items-center no-wrap full-width">
                            <div class="col">{{ criterion.id }} – {{ criterion.title }}</div>
                            <div class="col-auto">
                              <div class="row items-center q-gutter-xs">
                                <q-icon v-for="(claim, i) in criterion.claims" :key="`claim-${i}`" :name="i < (course.rules?.perCriterion?.count ?? 1) ? 'check_circle' : 'circle'" :color="getClaimSourceColour(claim.source)" size="sm" />
                                <q-icon v-for="i in Math.max(0, (course.rules?.perCriterion?.count ?? 1) - criterion.claims.length)" :key="`unclaimed-${i}`" name="radio_button_unchecked" color="grey-5" size="sm" />
                              </div>
                            </div>
                          </div>
                        </template>
                        <div class="q-mb-md">
                          <div class="row items-center q-gutter-sm">
                            <div class="col">
                              <div class="text-caption">Guidance:</div>
                              <ul class="q-pl-lg q-ma-none">
                                <li v-for="(guidance, idx) in criterion.guidance" :key="idx">{{ guidance }}</li>
                              </ul>
                            </div>
                            <div class="col-auto">
                              <q-btn dense color="primary" icon="add" label="Add claim" @click="openClaimDialog(unit.id, section.id, criterion)" />
                            </div>
                          </div>
                        </div>
                        <div v-if="criterion.claims.length === 0" class="text-grey">No claims recorded for this criterion yet.</div>
                        <div v-else>
                          <q-table :rows="criterion.claims" :columns="claimColumns" row-key="id" flat dense>
                            <template #body-cell-claimDate="props">
                              <q-td :props="props" align="center">
                                {{ formatDisplayDate(props.row.claimDate, 'Not recorded', false) }}
                              </q-td>
                            </template>
                            <template #body-cell-source="props">
                              <q-td :props="props" align="center">
                                <q-chip :color="getClaimSourceColour(props.row.source)" text-color="white">{{props.row.source}}</q-chip>
                              </q-td>
                            </template>
                            <template #body-cell-confirmed="props">
                              <q-td :props="props" align="center">
                                <q-checkbox v-model="props.row.confirmed" />
                              </q-td>
                            </template>
                            <template #body-cell-action="props">
                              <q-td :props="props" align="center">
                                <div class="row items-center justify-center">
                                  <q-btn dense flat icon="edit" color="primary" @click="openClaimDialog(unit.id, section.id, criterion, props.row)" />
                                  <ButtonWithConfirmation dense flat icon="delete" color="negative" confirm-message="Remove this claim?" @confirm="removeClaim(unit.id, section.id, criterion.id, props.row.id)" />
                                </div>
                              </q-td>
                            </template>
                          </q-table>
                        </div>
                      </q-expansion-item>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-scroll-area>
      </div>
    </div>

    <q-dialog v-model="claimDialogVisible" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ claimDialogContext.claimId ? 'Edit' : 'Add' }} claim for {{ claimDialogContext.criterionTitle }}</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-form @submit.prevent="saveClaimDialog">
            <q-input
              v-model="claimDialogContext.evidence"
              label="Evidence / Work"
              type="textarea"
              autogrow
              dense
              class="q-mb-md"
            />
            <div class="row q-gutter-md">
              <div class="col-12 col-md-6">
                <q-input v-model="claimDialogContext.claimDate" label="Claim date" type="date" dense />
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  v-model="claimDialogContext.source"
                  :options="claimSources"
                  label="Source type"
                  dense
                  emit-value
                  map-options
                />
              </div>
            </div>
            <q-checkbox v-model="claimDialogContext.confirmed" label="Tutor confirmed" dense class="q-mt-md" />
            <q-card-actions align="right" class="q-mt-md">
              <q-btn flat label="Cancel" color="secondary" @click="claimDialogVisible = false" />
              <q-btn label="Save claim" color="primary" type="submit" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="submitWorkDialogVisible" persistent>
      <q-card style="min-width: 480px;">
        <q-card-section>
          <div class="text-h6">Submit Work for Multiple Criteria</div>
          <div class="text-caption">Enter the work details and select the criteria to attach this claim to.</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-form @submit.prevent="saveSubmitWorkDialog">
            <q-input
              v-model="submitWorkContext.evidence"
              label="Work / Evidence"
              type="textarea"
              autogrow
              dense
              class="q-mb-md"
            />
            <div class="row q-gutter-md">
              <div class="col-12 col-md-4">
                <q-input v-model="submitWorkContext.claimDate" label="Claim date" type="date" dense />
              </div>
              <div class="col-12 col-md-4">
                <q-select
                  v-model="submitWorkContext.source"
                  :options="claimSources"
                  label="Claim type"
                  dense
                  emit-value
                  map-options
                />
              </div>
              <div class="col-12 col-md-4">
                <q-checkbox v-model="submitWorkContext.confirmed" label="Tutor confirmed" dense class="q-mt-sm" />
              </div>
            </div>
            <q-select
              v-model="submitWorkContext.selectedCriteria"
              :options="criteriaOptions"
              label="Select criteria to claim"
              hint="Search by criterion id or title"
              dense
              use-input
              multiple
              emit-value
              map-options
              option-label="label"
              option-value="value"
              use-chips
              class="q-mt-md"
            />
            <q-card-actions align="right" class="q-mt-md">
              <q-btn flat label="Cancel" color="secondary" @click="submitWorkDialogVisible = false" />
              <q-btn label="Submit work" color="primary" type="submit" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>


    <q-dialog v-model="submittedWorkDialogVisible" persistent>
      <q-card style="min-width: 640px; max-width: 900px;">
        <q-card-section class="row items-center q-gutter-sm">
          <div class="col">
            <div class="text-h6">Submitted work overview</div>
            <div class="text-caption">Each entry groups criteria by the submitted work name so related claims are shown together.</div>
          </div>
          <div class="col-auto">
            <q-btn flat round icon="close" @click="submittedWorkDialogVisible = false" />
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div v-if="submittedWorkGroups.length === 0" class="text-grey text-center q-pa-md">
            No submitted work has been recorded yet.
          </div>
          <div v-else class="q-gutter-md">
            <q-card v-for="group in submittedWorkGroups" :key="group.submissionId" bordered flat>
              <q-card-section>
                <div class="row items-start q-gutter-sm">
                  <div class="col">
                    <div class="text-subtitle2">Work</div>
                    <div class="text-body1">{{ group.evidence }}</div>
                  </div>
                  <div class="col-auto">
                    <q-chip :color="group.confirmed ? 'positive' : 'grey-5'" text-color="white" dense>
                      {{ group.confirmed ? 'Confirmed' : 'Pending' }}
                    </q-chip>
                  </div>
                </div>
                <div class="row q-gutter-sm q-mt-sm">
                  <div class="col-12 col-sm-6">
                    <div class="text-caption">Date</div>
                    <div>{{ formatDisplayDate(group.claimDate, 'Not recorded', false) }}</div>
                  </div>
                  <div class="col-12 col-sm-6">
                    <div class="text-caption">Source</div>
                    <div>{{ group.source }}</div>
                  </div>
                </div>
                <div class="q-mt-md">
                  <div class="text-caption">Claimed criteria</div>
                  <div class="q-gutter-xs q-mt-xs">
                    <q-chip v-for="criterion in group.criteria" :key="`${criterion.unitId}-${criterion.sectionId}-${criterion.criterionId}`" dense outline>
                      {{ criterion.label }}
                    </q-chip>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="secondary" @click="submittedWorkDialogVisible = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.course-criteria-content {
  max-width: 100%;
}

.course-actions-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2000;
}

.criteria-scroll-area {
  height: min(70vh, 760px);
  max-height: 70vh;
  width: 100%;
}

.criteria-scroll-content {
  padding-right: 8px;
}
</style>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { formatDisplayDate } from '@/utils/formatDate';
import { Notify, useQuasar } from 'quasar';
import type { Claim, ClaimSource, CourseSchema, Unit } from '@/types';
import { useCourseStore } from '@/composables/useCourseStore';
import { uuid } from '@/utils/uuid';
import FireworksDisplay from '@/components/FireworksDisplay.vue';
import ButtonWithConfirmation from '@/components/ButtonWithConfirmation.vue';

const { course } = useCourseStore();

const $q = useQuasar();

const drawerOpen = ref(!$q.screen.lt.md);
const drawerMini = ref(true);
const activeMenuItem = ref('overview');


function unitAnchorId(unitId: string) {
  return `unit-${unitId}`;
}

function sectionAnchorId(unitId: string, sectionId: string) {
  return `section-${unitId}-${sectionId}`;
}

const navigationItems = computed(() => {
  const items: Array<{ value: string; label: string; icon: string }> = [
    { value: 'overview', label: 'Overview', icon: 'dashboard' }
  ];

  const numberIconFor = (number: string) => {
    const suffix = Number.parseInt(number, 10);
    if (Number.isNaN(suffix)) return 'format_list_numbered';
    if (suffix >= 1 && suffix <= 9) {
      return `filter_${suffix}`;
    }
    return 'filter_9_plus';
  };

  const truncateMenuLabel = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length <= 100) return trimmed;
    return `${trimmed.slice(0, 97)}…`;
  };

  if (course.units.length <= 1) {
    course.units.forEach((unit) => {
      unit.sections.forEach((section) => {
        items.push({
          value: sectionAnchorId(unit.id, section.id),
          label: truncateMenuLabel(`Section ${section.id}: ${section.learningOutcome}`),
          icon: numberIconFor(section.id)
        });
      });
    });
    return items;
  }

  course.units.forEach((unit) => {
    items.push({
      value: unitAnchorId(unit.id),
      label: truncateMenuLabel(`Unit ${unit.id}: ${unit.learningOutcome}`),
      icon: numberIconFor(unit.id)
    });
  });

  return items;
});

function selectNavigationItem(targetId: string) {
  activeMenuItem.value = targetId;
  const element = document.getElementById(targetId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if ($q.screen.lt.md) {
    drawerOpen.value = false;
  }
}


const claimDialogVisible = ref(false);
const claimDialogContext = reactive({
  unitId: '',
  sectionId: '',
  criterionId: '',
  criterionTitle: '',
  claimId: '',
  evidence: '',
  claimDate: null as string | null,
  source: 'Written' as ClaimSource,
  confirmed: false
});

const claimSources = [
  'Written',
  'Testimony',
  'TutorObservation'
] as ClaimSource[];

const requiredSources = computed(() => {
  const counts = course.rules?.perType?.counts;
  if (counts && typeof counts === 'object') {
    return Object.keys(counts) as ClaimSource[];
  }
  return ['Written', 'Testimony', 'TutorObservation'] as ClaimSource[];
});

const perTypeScope = computed(() => (course.rules?.perType?.scope ?? 'unit'));

// overall progress based on perCriterion rule (caps claims per criterion at required count)
const perCriterionCount = computed(() => course.rules?.perCriterion?.count ?? 1);

const totalCriteria = computed(() => {
  return course.units.reduce((unitAcc, unit) => {
    return unitAcc + unit.sections.reduce((secAcc, section) => secAcc + (section.criteria?.length ?? 0), 0);
  }, 0);
});

const totalRequiredClaims = computed(() => perCriterionCount.value * totalCriteria.value);

const totalCountedClaims = computed(() => {
  return course.units.reduce((unitAcc, unit) => {
    return unitAcc + unit.sections.reduce((secAcc, section) => {
      return secAcc + section.criteria.reduce((critAcc, criterion) => {
        const claimCount = (criterion.claims?.length ?? 0);
        return critAcc + Math.min(claimCount, perCriterionCount.value);
      }, 0);
    }, 0);
  }, 0);
});

const overallProgressValue = computed(() => {
  if (totalRequiredClaims.value === 0) return 0;
  return Math.min(1, totalCountedClaims.value / totalRequiredClaims.value);
});

// boolean completion flag (avoid floating point equality issues)
const isCourseComplete = computed(() => {
  if (totalRequiredClaims.value === 0) return false;
  const criteriaComplete = totalCountedClaims.value >= totalRequiredClaims.value;
  const allUnitsComplete = course.units.length > 0 && course.units.every((unit) => unitComplete(unit));
  const allSectionsComplete = course.units.every((unit) => unit.sections.every((section) => sectionComplete(section)));
  return criteriaComplete && allUnitsComplete && allSectionsComplete;
});


const submitWorkDialogVisible = ref(false);
const submittedWorkDialogVisible = ref(false);
const searchQuery = ref('');
const selectedUnitIds = ref<string[]>([]);
const selectedWorkEvidence = ref<string | null>(null);
const showIncompleteOnly = ref(false);

const unitOptions = computed(() =>
  course.units.map((unit) => ({
    label: `Unit ${unit.id}: ${unit.learningOutcome}`,
    value: unit.id
  }))
);

const workEvidenceOptions = computed(() => {
  const groups = submittedWorkGroups.value;
  return groups.map((group) => ({
    label: group.evidence,
    value: group.evidence
  }));
});

const submitWorkContext = reactive({
  evidence: '',
  claimDate: null as string | null,
  source: 'Written' as ClaimSource,
  confirmed: false,
  selectedCriteria: [] as string[]
});

const criteriaOptions = computed(() => {
  const options: { value: string; label: string }[] = [];
  course.units.forEach((unit) => {
    unit.sections.forEach((section) => {
      section.criteria.forEach((criterion) => {
        options.push({
          value: `${unit.id}|${section.id}|${criterion.id}`,
          label: `${criterion.id} – ${criterion.title}`
        });
      });
    });
  });
  return options;
});

const submittedWorkGroups = computed(() => {
  const groups = new Map<string, {
    evidence: string;
    claimDate: string | null;
    source: ClaimSource;
    confirmed: boolean;
    criteria: Array<{ unitId: string; sectionId: string; criterionId: string; label: string }>;
  }>();

  course.units.forEach((unit) => {
    unit.sections.forEach((section) => {
      section.criteria.forEach((criterion) => {
        criterion.claims.forEach((claim) => {
          const workKey = claim.evidence.trim().toLowerCase();
          const existingGroup = groups.get(workKey);
          const criterionLabel = `${criterion.id} – ${criterion.title}`;

          if (existingGroup) {
            const alreadyAttached = existingGroup.criteria.some(
              (item) => item.unitId === unit.id && item.sectionId === section.id && item.criterionId === criterion.id
            );

            if (!alreadyAttached) {
              existingGroup.criteria.push({
                unitId: unit.id,
                sectionId: section.id,
                criterionId: criterion.id,
                label: criterionLabel
              });
            }
          } else {
            groups.set(workKey, {
              evidence: claim.evidence,
              claimDate: claim.claimDate,
              source: claim.source,
              confirmed: claim.confirmed,
              criteria: [{
                unitId: unit.id,
                sectionId: section.id,
                criterionId: criterion.id,
                label: criterionLabel
              }]
            });
          }
        });
      });
    });
  });

  return Array.from(groups.values());
});

function getClaimSourceColour(source: ClaimSource) {
  switch (source) {
    case 'Written':
      return 'green';
    case 'Testimony':
      return 'blue';
    case 'TutorObservation':
      return 'orange';
    default:
      return 'grey';
  }
}

function matchesText(value: string | null | undefined, query: string) {
  if (!value) {
    return false;
  }
  return value.toLowerCase().includes(query);
}

function criterionMatchesQuery(criterion: { id: string; title: string; guidance: string[]; claims: Claim[] }, query: string) {
  if (!query) {
    return true;
  }

  const haystacks = [
    criterion.id,
    criterion.title,
    criterion.guidance.join(' '),
    criterion.claims.map((claim) => claim.evidence).join(' '),
    criterion.claims.map((claim) => claim.source).join(' ')
  ];

  return haystacks.some((value) => matchesText(value, query));
}

function sectionMatchesQuery(section: { learningOutcome: string; criteria: Array<{ id: string; title: string; guidance: string[]; claims: Claim[] }> }, query: string) {
  if (!query) {
    return true;
  }

  return matchesText(section.learningOutcome, query) || section.criteria.some((criterion) => criterionMatchesQuery(criterion, query));
}

function visibleCriteriaForSection(section: { learningOutcome: string; criteria: Array<{ id: string; title: string; guidance: string[]; claims: Claim[] }> }, query: string) {
  if (!query) {
    return section.criteria;
  }

  if (matchesText(section.learningOutcome, query)) {
    return section.criteria;
  }

  return section.criteria.filter((criterion) => criterionMatchesQuery(criterion, query));
}

const filteredUnits = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  return course.units.reduce<Unit[]>((accumulator, unit) => {
    if (selectedUnitIds.value.length > 0 && !selectedUnitIds.value.includes(unit.id)) {
      return accumulator;
    }

    const matchingSections = unit.sections
      .filter((section) => {
        if (query && !sectionMatchesQuery(section, query)) {
          return false;
        }

        return true;
      })
      .map((section) => {
        let criteria = section.criteria;

        if (showIncompleteOnly.value) {
          criteria = criteria.filter((criterion) =>
            (criterion.claims?.length ?? 0) < perCriterionCount.value
          );
        }

        if (selectedWorkEvidence.value) {
          criteria = criteria.filter((criterion) =>
            (criterion.claims?.length ?? 0) > 0 && criterion.claims.some((claim) => claim.evidence === selectedWorkEvidence.value)
          );
        }

        if (query) {
          criteria = criteria.filter((criterion) => criterionMatchesQuery(criterion, query));
        }

        return {
          ...section,
          criteria
        };
      })
      .filter((section) => section.criteria.length > 0);

    if (matchingSections.length > 0) {
      accumulator.push({
        ...unit,
        sections: matchingSections
      });
    }

    return accumulator;
  }, []);
});

function openClaimDialog(unitId: string, sectionId: string, criterion: { id: string; title: string }, claim?: Claim) {
  claimDialogContext.unitId = unitId;
  claimDialogContext.sectionId = sectionId;
  claimDialogContext.criterionId = criterion.id;
  claimDialogContext.criterionTitle = criterion.title;

  if (claim) {
    claimDialogContext.claimId = claim.id;
    claimDialogContext.evidence = claim.evidence;
    claimDialogContext.claimDate = claim.claimDate;
    claimDialogContext.source = claim.source;
    claimDialogContext.confirmed = claim.confirmed;
  } else {
    claimDialogContext.claimId = '';
    claimDialogContext.evidence = '';
    claimDialogContext.claimDate = null;
    claimDialogContext.source = 'Written';
    claimDialogContext.confirmed = false;
  }

  claimDialogVisible.value = true;
}

function saveClaimDialog() {
  if (!claimDialogContext.evidence.trim()) {
    Notify.create({ type: 'negative', message: 'Enter evidence for the claim before saving.' });
    return;
  }

  const unit = course.units.find((u) => u.id === claimDialogContext.unitId);
  const section = unit?.sections.find((s) => s.id === claimDialogContext.sectionId);
  const criterion = section?.criteria.find((c) => c.id === claimDialogContext.criterionId);

  if (!criterion) {
    Notify.create({ type: 'negative', message: 'Unable to locate the criterion for this claim.' });
    return;
  }

  if (claimDialogContext.claimId) {
    const claim = criterion.claims.find((c) => c.id === claimDialogContext.claimId);
    if (claim) {
      claim.evidence = claimDialogContext.evidence;
      claim.claimDate = claimDialogContext.claimDate;
      claim.source = claimDialogContext.source;
      claim.confirmed = claimDialogContext.confirmed;
      Notify.create({ type: 'positive', message: 'Claim updated successfully.' });
    }
  } else {
    criterion.claims.push({
      id: uuid(),
      evidence: claimDialogContext.evidence,
      claimDate: claimDialogContext.claimDate || null,
      source: claimDialogContext.source,
      confirmed: claimDialogContext.confirmed
    });
    Notify.create({ type: 'positive', message: 'Claim added successfully.' });
  }

  claimDialogVisible.value = false;
}

function openSubmitWorkDialog() {
  submitWorkContext.evidence = '';
  submitWorkContext.claimDate = null;
  submitWorkContext.source = 'Written';
  submitWorkContext.confirmed = false;
  submitWorkContext.selectedCriteria = [];
  submitWorkDialogVisible.value = true;
}

function parseCriteriaIdentifier(identifier: string) {
  const [unitId, sectionId, criterionId] = identifier.split('|');
  return { unitId, sectionId, criterionId };
}

function saveSubmitWorkDialog() {
  if (!submitWorkContext.evidence.trim()) {
    Notify.create({ type: 'negative', message: 'Enter the work evidence before submitting.' });
    return;
  }

  if (submitWorkContext.selectedCriteria.length === 0) {
    Notify.create({ type: 'negative', message: 'Select at least one criterion to attach this work to.' });
    return;
  }

  submitWorkContext.selectedCriteria.forEach((criteriaKey) => {
    const { unitId, sectionId, criterionId } = parseCriteriaIdentifier(criteriaKey);
    const unit = course.units.find((u) => u.id === unitId);
    const section = unit?.sections.find((s) => s.id === sectionId);
    const criterion = section?.criteria.find((c) => c.id === criterionId);
    if (criterion) {
      criterion.claims.push({
        id: uuid(),
        evidence: submitWorkContext.evidence,
        claimDate: submitWorkContext.claimDate || null,
        source: submitWorkContext.source,
        confirmed: submitWorkContext.confirmed
      });
    }
  });

  Notify.create({ type: 'positive', message: 'Work submitted and claims created successfully.' });
  submitWorkDialogVisible.value = false;
}

function removeClaim(unitId: string, sectionId: string, criterionId: string, claimId: string) {
  const unit = course.units.find((u) => u.id === unitId);
  const section = unit?.sections.find((s) => s.id === sectionId);
  const criterion = section?.criteria.find((c) => c.id === criterionId);
  if (!criterion) {
    return;
  }
  criterion.claims = criterion.claims.filter((claim) => claim.id !== claimId);
  Notify.create({ type: 'warning', message: 'Claim removed.' });
}

function unitSourceCount(unit: Unit, source: ClaimSource) {
  return unit.sections.reduce((count, section) => count + section.criteria.reduce((sectionCount, criterion) => sectionCount + criterion.claims.filter((claim) => claim.source === source).length, 0), 0);
}

function courseUnit(unitId: string) {
  const unit = course.units.find((candidate) => candidate.id === unitId);
  if (!unit) {
    throw new Error(`Unit ${unitId} was not found in the course model.`);
  }
  return unit;
}

function courseSection(unitId: string, sectionId: string) {
  const section = courseUnit(unitId).sections.find((candidate) => candidate.id === sectionId);
  if (!section) {
    throw new Error(`Section ${sectionId} was not found in unit ${unitId}.`);
  }
  return section;
}

function sectionSourceCount(section: Unit['sections'][0], source: ClaimSource) {
  return section.criteria.reduce((count, criterion) => count + criterion.claims.filter((claim) => claim.source === source).length, 0);
}

function sectionComplete(section: Unit['sections'][0]) {
  const perType = course.rules?.perType;
  const sources = requiredSources.value ?? [];
  if (!perType || perType.scope === 'section') {
    return sources.every((source) => sectionSourceCount(section, source) >= (course.rules?.perType?.counts?.[source] ?? 0));
  }

  // perType.scope === 'unit'
  return section.criteria.every((criterion) => (criterion.claims?.length ?? 0) >= perCriterionCount.value);
}

function unitComplete(unit: Unit) {
  const perType = course.rules?.perType;
  const sources = requiredSources.value ?? [];
  if (!perType || perType.scope === 'unit') {
    return sources.every((source) => unitSourceCount(unit, source) >= (course.rules?.perType?.counts?.[source] ?? 0))
      && unit.sections.every((section) => sectionComplete(section));
  }

  // perType.scope === 'section'
  return unit.sections.every((section) => sectionComplete(section));
}

const claimColumns = [
  { name: 'evidence', label: 'Evidence', field: 'evidence', align: 'left' },
  { name: 'claimDate', label: 'Date', field: 'claimDate', align: 'center' },
  { name: 'source', label: 'Source', field: 'source', align: 'center' },
  { name: 'confirmed', label: 'Confirmed', field: 'confirmed', align: 'center' },
  { name: 'action', label: 'Action', field: 'action', align: 'center' }
];

</script>
