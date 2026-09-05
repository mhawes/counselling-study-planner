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
        @click="openCourseworkDialog()"
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

      <div v-else-if="activeMenuItem === 'submitted-work'">
        <q-card>
          <q-card-section class="row items-center q-gutter-sm">
            <div class="col">
              <div class="text-h6">Submitted work</div>
              <div class="text-caption">Track work items, attach them to criteria, and update the status of submissions.</div>
            </div>
            <div class="col-auto">
              <q-btn dense color="primary" icon="add" label="New coursework" @click="openCourseworkDialog()" />
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div v-if="submittedWorkGroups.length === 0" class="text-grey text-center q-pa-md">
              No coursework has been recorded yet.
            </div>
            <div v-else class="row q-col-gutter-md">
              <div v-for="group in submittedWorkGroups" :key="group.id" class="col-12">
                <q-card bordered flat>
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
                        <q-chip v-for="criterion in group.criteria" :key="`${group.id}-${criterion.unitId}-${criterion.sectionId}-${criterion.criterionId}`" dense outline>
                          {{ criterion.label }}
                        </q-chip>
                      </div>
                    </div>
                    <div class="row justify-end q-gutter-sm q-mt-lg">
                      <q-btn dense flat icon="edit" color="primary" @click="openCourseworkDialog(group)" />
                      <ButtonWithConfirmation dense flat icon="delete" color="negative" confirm-message="Delete this coursework item and all linked claims?" @confirm="deleteCoursework(group.id)" />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
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
                                <q-icon v-for="(claim, i) in criterion.claims" :key="`claim-${i}`" :name="i < (course.rules?.perCriterion?.count ?? 1) ? 'check_circle' : 'circle'" :color="getClaimSourceColour(getClaimType(claim))" size="sm" />
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
                            <template #body-cell-evidence="props">
                              <q-td :props="props" align="left">
                                {{ getClaimName(props.row) || 'Not recorded' }}
                              </q-td>
                            </template>
                            <template #body-cell-claimDate="props">
                              <q-td :props="props" align="center">
                                {{ formatDisplayDate(getClaimDate(props.row), 'Not recorded', false) }}
                              </q-td>
                            </template>
                            <template #body-cell-source="props">
                              <q-td :props="props" align="center">
                                <q-chip :color="getClaimSourceColour(getClaimType(props.row))" text-color="white">{{ getClaimType(props.row) }}</q-chip>
                              </q-td>
                            </template>
                            <template #body-cell-confirmed="props">
                              <q-td :props="props" align="center">
                                <q-checkbox :model-value="isClaimConfirmed(props.row)" @update:model-value="updateClaimConfirmed(props.row, $event)" />
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
            <q-select
              v-model="claimDialogContext.courseworkId"
              :options="courseworkOptions"
              :display-value="claimDialogContext.courseworkId ? getCourseworkLabel(claimDialogContext.courseworkId) : undefined"
              label="Existing coursework"
              dense
              clearable
              emit-value
              map-options
              option-label="label"
              option-value="value"
              :disable="!!claimDialogContext.evidence.trim()"
              hint="Select an existing piece of work or leave blank to create a new one"
              class="q-mb-md"
            />
            <q-input
              v-model="claimDialogContext.evidence"
              label="New work name"
              type="textarea"
              autogrow
              dense
              class="q-mb-md"
              :disable="!!claimDialogContext.courseworkId"
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

    <q-dialog v-model="courseworkDialogVisible" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ courseworkDialogContext.courseworkId ? 'Edit' : 'Submit' }} coursework</div>
          <div class="text-caption">Add or update the submitted work and attach it to one or more criteria.</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-form @submit.prevent="saveCourseworkDialog">
            <q-input
              v-model="courseworkDialogContext.name"
              label="Work / Evidence"
              type="textarea"
              autogrow
              dense
              class="q-mb-md"
            />
            <div class="row q-gutter-md">
              <div class="col-12 col-md-4">
                <q-input v-model="courseworkDialogContext.date" label="Submission date" type="date" dense />
              </div>
              <div class="col-12 col-md-4">
                <q-select
                  v-model="courseworkDialogContext.type"
                  :options="claimSources"
                  label="Work type"
                  dense
                  emit-value
                  map-options
                />
              </div>
              <div class="col-12 col-md-4">
                <q-checkbox v-model="courseworkDialogContext.confirmed" label="Tutor confirmed" dense class="q-mt-sm" />
              </div>
            </div>
            <q-select
              v-model="courseworkDialogContext.selectedCriteria"
              :options="criteriaOptions"
              label="Select criteria to attach"
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
              <q-btn flat label="Cancel" color="secondary" @click="courseworkDialogVisible = false" />
              <q-btn :label="courseworkDialogContext.courseworkId ? 'Save changes' : 'Submit work'" color="primary" type="submit" />
            </q-card-actions>
          </q-form>
        </q-card-section>
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
import type { Claim, ClaimSource, CourseSchema, Coursework, Unit } from '@/types';
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
    { value: 'overview', label: 'Overview', icon: 'dashboard' },
    { value: 'submitted-work', label: 'Submitted work', icon: 'assignment' }
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
  courseworkId: '' as string,
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

function findCourseworkById(courseworkId: string | null | undefined): Coursework | null {
  if (!courseworkId) {
    return null;
  }
  return course.coursework.find((item) => item.id === courseworkId) ?? null;
}

function getCourseworkLabel(courseworkId: string | null | undefined) {
  return findCourseworkById(courseworkId)?.name ?? 'Unknown coursework';
}

function getClaimName(claim: Claim) {
  return findCourseworkById(claim.courseworkId)?.name ?? '';
}

function getClaimDate(claim: Claim) {
  return findCourseworkById(claim.courseworkId)?.date ?? null;
}

function getClaimType(claim: Claim): ClaimSource {
  return findCourseworkById(claim.courseworkId)?.type ?? 'Written';
}

function isClaimConfirmed(claim: Claim) {
  return findCourseworkById(claim.courseworkId)?.confirmed ?? false;
}

function syncCourseworkOnClaim(claim: Claim, payload: Pick<Coursework, 'name' | 'date' | 'type' | 'confirmed'>) {
  const existing = findCourseworkById(claim.courseworkId);

  if (existing) {
    existing.name = payload.name;
    existing.date = payload.date;
    existing.type = payload.type;
    existing.confirmed = payload.confirmed;
    return existing;
  }

  const newCoursework: Coursework = {
    id: claim.courseworkId,
    name: payload.name,
    confirmed: payload.confirmed,
    date: payload.date,
    type: payload.type
  };

  course.coursework.push(newCoursework);
  return newCoursework;
}

function updateClaimConfirmed(claim: Claim, value: boolean) {
  const coursework = findCourseworkById(claim.courseworkId);
  if (coursework) {
    coursework.confirmed = value;
  }
}

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


const courseworkDialogVisible = ref(false);
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

const courseworkDialogContext = reactive({
  courseworkId: '',
  name: '',
  date: null as string | null,
  type: 'Written' as ClaimSource,
  confirmed: false,
  selectedCriteria: [] as string[]
});

const courseworkOptions = computed(() =>
  course.coursework.map((item) => ({
    label: item.name,
    value: item.id
  }))
);

const workEvidenceOptions = computed(() => {
  const groups = submittedWorkGroups.value;
  return groups.map((group) => ({
    label: group.evidence,
    value: group.evidence
  }));
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

const submittedWorkGroups = computed(() =>
  course.coursework.map((item) => ({
    id: item.id,
    evidence: item.name,
    claimDate: item.date,
    source: item.type,
    confirmed: item.confirmed,
    criteria: course.units.flatMap((unit) => {
      return unit.sections.flatMap((section) => {
        return section.criteria
          .filter((criterion) => criterion.claims.some((claim) => claim.courseworkId === item.id))
          .map((criterion) => ({
            unitId: unit.id,
            sectionId: section.id,
            criterionId: criterion.id,
            label: `${criterion.id} – ${criterion.title}`
          }));
      });
    })
  }))
);

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
    criterion.claims.map((claim) => getClaimName(claim)).join(' '),
    criterion.claims.map((claim) => getClaimType(claim)).join(' ')
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
            (criterion.claims?.length ?? 0) > 0 && criterion.claims.some((claim) => getClaimName(claim) === selectedWorkEvidence.value)
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
    const coursework = findCourseworkById(claim.courseworkId);
    claimDialogContext.claimId = claim.id;
    claimDialogContext.courseworkId = claim.courseworkId;
    claimDialogContext.evidence = coursework?.name ?? '';
    claimDialogContext.claimDate = coursework?.date ?? null;
    claimDialogContext.source = coursework?.type ?? 'Written';
    claimDialogContext.confirmed = coursework?.confirmed ?? false;
  } else {
    claimDialogContext.claimId = '';
    claimDialogContext.courseworkId = '';
    claimDialogContext.evidence = '';
    claimDialogContext.claimDate = null;
    claimDialogContext.source = 'Written';
    claimDialogContext.confirmed = false;
  }

  claimDialogVisible.value = true;
}

function saveClaimDialog() {
  const unit = course.units.find((u) => u.id === claimDialogContext.unitId);
  const section = unit?.sections.find((s) => s.id === claimDialogContext.sectionId);
  const criterion = section?.criteria.find((c) => c.id === claimDialogContext.criterionId);

  if (!criterion) {
    Notify.create({ type: 'negative', message: 'Unable to locate the criterion for this claim.' });
    return;
  }

  const selectedCourseworkId = claimDialogContext.courseworkId || null;
  const newName = claimDialogContext.evidence.trim();
  const selectedCoursework = selectedCourseworkId ? findCourseworkById(selectedCourseworkId) : null;

  if (!selectedCoursework && !newName) {
    Notify.create({ type: 'negative', message: 'Select an existing coursework item or enter a new work name before saving.' });
    return;
  }

  const resolveCourseworkId = () => {
    if (selectedCourseworkId && selectedCoursework) {
      return selectedCoursework.id;
    }

    const newId = uuid();
    course.coursework.push({
      id: newId,
      name: newName,
      confirmed: claimDialogContext.confirmed,
      date: claimDialogContext.claimDate || null,
      type: claimDialogContext.source
    });
    return newId;
  };

  const courseworkId = resolveCourseworkId();

  if (selectedCoursework) {
    selectedCoursework.name = selectedCoursework.name || newName || selectedCoursework.name;
    selectedCoursework.date = claimDialogContext.claimDate || selectedCoursework.date;
    selectedCoursework.type = claimDialogContext.source;
    selectedCoursework.confirmed = claimDialogContext.confirmed;
  }

  if (!selectedCoursework && newName) {
    const coursework = findCourseworkById(courseworkId);
    if (coursework) {
      coursework.name = newName;
      coursework.date = claimDialogContext.claimDate || null;
      coursework.type = claimDialogContext.source;
      coursework.confirmed = claimDialogContext.confirmed;
    }
  }

  if (claimDialogContext.claimId) {
    const claim = criterion.claims.find((c) => c.id === claimDialogContext.claimId);
    if (claim) {
      claim.courseworkId = courseworkId;
      Notify.create({ type: 'positive', message: 'Claim updated successfully.' });
    }
  } else {
    criterion.claims.push({
      id: uuid(),
      courseworkId
    });
    Notify.create({ type: 'positive', message: 'Claim added successfully.' });
  }

  claimDialogVisible.value = false;
}

function openCourseworkDialog(coursework?: { id: string; evidence: string; claimDate: string | null; source: ClaimSource; confirmed: boolean }) {
  if (coursework) {
    courseworkDialogContext.courseworkId = coursework.id;
    courseworkDialogContext.name = coursework.evidence;
    courseworkDialogContext.date = coursework.claimDate;
    courseworkDialogContext.type = coursework.source;
    courseworkDialogContext.confirmed = coursework.confirmed;
    courseworkDialogContext.selectedCriteria = []; 
    course.units.forEach((unit) => {
      unit.sections.forEach((section) => {
        section.criteria.forEach((criterion) => {
          if (criterion.claims.some((claim) => claim.courseworkId === coursework.id)) {
            courseworkDialogContext.selectedCriteria.push(`${unit.id}|${section.id}|${criterion.id}`);
          }
        });
      });
    });
  } else {
    courseworkDialogContext.courseworkId = '';
    courseworkDialogContext.name = '';
    courseworkDialogContext.date = null;
    courseworkDialogContext.type = 'Written';
    courseworkDialogContext.confirmed = false;
    courseworkDialogContext.selectedCriteria = [];
  }

  courseworkDialogVisible.value = true;
}

function parseCriteriaIdentifier(identifier: string) {
  const [unitId, sectionId, criterionId] = identifier.split('|');
  return { unitId, sectionId, criterionId };
}

function saveCourseworkDialog() {
  if (!courseworkDialogContext.name.trim()) {
    Notify.create({ type: 'negative', message: 'Enter the work name before submitting.' });
    return;
  }

  if (courseworkDialogContext.selectedCriteria.length === 0) {
    Notify.create({ type: 'negative', message: 'Select at least one criterion to attach this work to.' });
    return;
  }

  const normalizedName = courseworkDialogContext.name.trim();
  const courseworkId = courseworkDialogContext.courseworkId || uuid();

  const existing = course.coursework.find((item) => item.id === courseworkId);
  if (existing) {
    existing.name = normalizedName;
    existing.date = courseworkDialogContext.date || null;
    existing.type = courseworkDialogContext.type;
    existing.confirmed = courseworkDialogContext.confirmed;
  } else {
    course.coursework.push({
      id: courseworkId,
      name: normalizedName,
      confirmed: courseworkDialogContext.confirmed,
      date: courseworkDialogContext.date || null,
      type: courseworkDialogContext.type
    });
  }

  const currentlyAttached = new Set<string>();
  course.units.forEach((unit) => {
    unit.sections.forEach((section) => {
      section.criteria.forEach((criterion) => {
        const matches = criterion.claims.filter((claim) => claim.courseworkId === courseworkId);
        matches.forEach((claim) => {
          currentlyAttached.add(`${unit.id}|${section.id}|${criterion.id}`);
        });
      });
    });
  });

  course.units.forEach((unit) => {
    unit.sections.forEach((section) => {
      section.criteria.forEach((criterion) => {
        const key = `${unit.id}|${section.id}|${criterion.id}`;
        const isSelected = courseworkDialogContext.selectedCriteria.includes(key);
        const existingClaims = criterion.claims.filter((claim) => claim.courseworkId === courseworkId);

        if (isSelected && existingClaims.length === 0) {
          criterion.claims.push({ id: uuid(), courseworkId });
        }

        if (!isSelected && existingClaims.length > 0) {
          criterion.claims = criterion.claims.filter((claim) => !(claim.courseworkId === courseworkId));
        }
      });
    });
  });

  if (courseworkDialogContext.courseworkId) {
    Notify.create({ type: 'positive', message: 'Coursework updated successfully.' });
  } else {
    Notify.create({ type: 'positive', message: 'Work submitted and claims created successfully.' });
  }

  courseworkDialogVisible.value = false;
}

function deleteCoursework(courseworkId: string) {
  course.coursework = course.coursework.filter((item) => item.id !== courseworkId);
  course.units.forEach((unit) => {
    unit.sections.forEach((section) => {
      section.criteria.forEach((criterion) => {
        criterion.claims = criterion.claims.filter((claim) => claim.courseworkId !== courseworkId);
      });
    });
  });
  Notify.create({ type: 'warning', message: 'Coursework deleted.' });
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
  return unit.sections.reduce((count, section) => count + section.criteria.reduce((sectionCount, criterion) => sectionCount + criterion.claims.filter((claim) => getClaimType(claim) === source).length, 0), 0);
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
  return section.criteria.reduce((count, criterion) => count + criterion.claims.filter((claim) => getClaimType(claim) === source).length, 0);
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
