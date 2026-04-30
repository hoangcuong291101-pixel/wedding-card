<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { useGuests } from '@/composables/useGuests'
import { useWedding } from '@/composables/useWedding'
import type { Guest, GuestSide, TimelineItem } from '@/types/invitation'

const { guests, upsertGuest, updateGuest, removeGuest } = useGuests()
const { wedding, isLoadingWedding, loadWedding, updateWedding } = useWedding()

// ── Guest form ───────────────────────────────────────────────────────────────
const form = ref({
  slug: '',
  name: '',
  side: 'groom' as GuestSide,
})

// ── Wedding form ─────────────────────────────────────────────────────────────
const weddingForm = ref({
  groomName: '',
  brideName: '',
  weddingDateStart: '', // YYYY-MM-DD
  weddingDateEnd: '', // YYYY-MM-DD
  venueNote: '',
})

// ── Family form ──────────────────────────────────────────────────────────────
const familyForm = ref({
  groom: { label: '', dad: '', mom: '', address: '', phone: '', googleMapUrl: '' },
  bride: { label: '', dad: '', mom: '', address: '', phone: '', googleMapUrl: '' },
})

// ── Timeline form ────────────────────────────────────────────────────────────
type TimelineSide = 'groom' | 'bride'
const timelinesForm = ref<{ groom: TimelineItem[]; bride: TimelineItem[] }>({
  groom: [],
  bride: [],
})
const timelineForm = ref({ date: '', time: '', title: '', description: '' })
const editingTimelineSide = ref<TimelineSide>('groom')
const editingTimelineIndex = ref<number | null>(null)
const activeTimelineSide = ref<TimelineSide>('groom')

const editingSlug = ref<string | null>(null)
const copiedSlug = ref<string | null>(null)
const weddingSaved = ref(false)
const ADMIN_PASSWORD = '2911'
const ADMIN_UNLOCK_KEY = 'wedding-admin-unlocked'
const isUnlocked = ref(false)
const passwordInput = ref('')
const passwordError = ref('')
const hasLoadedDashboard = ref(false)

const inviteBase = computed(() => `${window.location.origin}/invite`)

// ── Date/time helpers ────────────────────────────────────────────────────────
function dateToInput(ddmmyyyy: string): string {
  const parts = ddmmyyyy.trim().split('/')
  if (parts.length !== 3) return ''
  const [dd, mm, yyyy] = parts
  return `${yyyy ?? ''}-${(mm ?? '').padStart(2, '0')}-${(dd ?? '').padStart(2, '0')}`
}

function inputToDate(yyyymmdd: string): string {
  if (!yyyymmdd) return ''
  const [yyyy, mm, dd] = yyyymmdd.split('-')
  return `${dd}/${mm}/${yyyy}`
}

function weddingDateToString(): string {
  const start = inputToDate(weddingForm.value.weddingDateStart)
  const end = inputToDate(weddingForm.value.weddingDateEnd)
  if (start && end) return `${start} - ${end}`
  return start || end
}

// "09:00 - 09/05/2026" → "2026-05-09T09:00"
function inviteTimeToInput(inviteTime: string): string {
  if (!inviteTime) return ''
  const parts = inviteTime.split(' - ')
  if (parts.length !== 2) return ''
  const [time, datePart] = parts as [string, string]
  const dateParts = datePart.split('/')
  if (dateParts.length !== 3) return ''
  const [dd, mm, yyyy] = dateParts
  return `${yyyy ?? ''}-${(mm ?? '').padStart(2, '0')}-${(dd ?? '').padStart(2, '0')}T${time}`
}

// "2026-05-09T09:00" → "09:00 - 09/05/2026"
function inputToInviteTime(value: string): string {
  if (!value) return ''
  const [datePart, time] = value.split('T')
  if (!datePart || !time) return ''
  const [yyyy, mm, dd] = datePart.split('-')
  return `${time} - ${dd}/${mm}/${yyyy}`
}

async function initializeDashboard() {
  if (hasLoadedDashboard.value) return
  await loadWedding()
  if (wedding.value) {
    const dateParts = wedding.value.weddingDate.split(' - ')
    weddingForm.value = {
      groomName: wedding.value.groomName,
      brideName: wedding.value.brideName,
      weddingDateStart: dateToInput(dateParts[0] ?? ''),
      weddingDateEnd: dateToInput(dateParts[1] ?? ''),
      venueNote: wedding.value.venue.note,
    }
    familyForm.value = {
      groom: { ...wedding.value.families.groom },
      bride: { ...wedding.value.families.bride },
    }
    timelinesForm.value = {
      groom: wedding.value.timelines.groom.map((i) => ({ ...i })),
      bride: wedding.value.timelines.bride.map((i) => ({ ...i })),
    }
  }
  hasLoadedDashboard.value = true
}

async function unlockManagement() {
  if (passwordInput.value.trim() !== ADMIN_PASSWORD) {
    passwordError.value = 'Mật khẩu không đúng'
    return
  }

  passwordError.value = ''
  isUnlocked.value = true
  sessionStorage.setItem(ADMIN_UNLOCK_KEY, '1')
  await initializeDashboard()
}

// ── Mount ────────────────────────────────────────────────────────────────────
onMounted(async () => {
  const unlocked = sessionStorage.getItem(ADMIN_UNLOCK_KEY) === '1'
  if (!unlocked) return

  isUnlocked.value = true
  await initializeDashboard()
})

// ── Guest actions ────────────────────────────────────────────────────────────
function resetForm() {
  form.value = { slug: '', name: '', side: 'groom' }
  editingSlug.value = null
}

function submitGuest() {
  if (!form.value.name.trim()) return

  if (editingSlug.value) {
    updateGuest(editingSlug.value, {
      name: form.value.name,
      side: form.value.side,
      inviteTime: '',
      nextSlug: form.value.slug,
    })
  } else {
    upsertGuest({
      name: form.value.name,
      slug: form.value.slug,
      side: form.value.side,
      inviteTime: '',
    })
  }

  resetForm()
}

// ── Wedding actions ──────────────────────────────────────────────────────────
async function saveWeddingInfo() {
  if (!wedding.value) return

  await updateWedding({
    groomName: weddingForm.value.groomName.trim(),
    brideName: weddingForm.value.brideName.trim(),
    weddingDate: weddingDateToString(),
    venue: { ...wedding.value.venue, note: weddingForm.value.venueNote.trim() },
    families: {
      groom: { ...familyForm.value.groom },
      bride: { ...familyForm.value.bride },
    },
    timelines: {
      groom: timelinesForm.value.groom,
      bride: timelinesForm.value.bride,
    },
  })

  weddingSaved.value = true
  window.setTimeout(() => {
    weddingSaved.value = false
  }, 1800)
}

// ── Timeline actions ─────────────────────────────────────────────────────────
function resetTimelineForm() {
  timelineForm.value = { date: '', time: '', title: '', description: '' }
  editingTimelineIndex.value = null
}

function submitTimeline() {
  const item: TimelineItem = {
    date: timelineForm.value.date.trim(),
    time: timelineForm.value.time.trim(),
    title: timelineForm.value.title.trim(),
    description: timelineForm.value.description.trim(),
  }
  const side = editingTimelineSide.value
  if (editingTimelineIndex.value !== null) {
    timelinesForm.value[side][editingTimelineIndex.value] = item
  } else {
    timelinesForm.value[side].push(item)
  }
  resetTimelineForm()
}

function editTimelineItem(side: TimelineSide, index: number) {
  editingTimelineSide.value = side
  activeTimelineSide.value = side
  editingTimelineIndex.value = index
  const item = timelinesForm.value[side][index]
  if (item) timelineForm.value = { ...item }
}

function removeTimelineItem(side: TimelineSide, index: number) {
  timelinesForm.value[side].splice(index, 1)
  if (editingTimelineSide.value === side && editingTimelineIndex.value === index) {
    resetTimelineForm()
  }
}

function moveTimelineItem(side: TimelineSide, index: number, dir: -1 | 1) {
  const list = timelinesForm.value[side]
  const next = index + dir
  if (next < 0 || next >= list.length) return
  const tmp = list[index]!
  list[index] = list[next]!
  list[next] = tmp
}

function selectTimelineSide(side: TimelineSide) {
  activeTimelineSide.value = side
  editingTimelineSide.value = side
  resetTimelineForm()
}

function editGuest(guest: Guest) {
  editingSlug.value = guest.slug
  form.value = {
    slug: guest.slug,
    name: guest.name,
    side: guest.side,
  }
}

function sideLabel(side: GuestSide) {
  return side === 'bride' ? 'Khách nhà gái' : 'Khách nhà trai'
}

async function copyInviteLink(slug: string) {
  const url = `${inviteBase.value}/${slug}`

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
  } else {
    const input = document.createElement('input')
    input.value = url
    document.body.append(input)
    input.select()
    document.execCommand('copy')
    input.remove()
  }

  copiedSlug.value = slug
  window.setTimeout(() => {
    if (copiedSlug.value === slug) copiedSlug.value = null
  }, 1800)
}
</script>

<template>
  <main class="min-h-screen bg-[#f6f3ee] px-4 py-8 text-[#3e312e]">
    <section
      class="mx-auto w-full max-w-5xl xl:max-w-7xl space-y-6 rounded-3xl bg-white p-6 shadow-lg ring-1 ring-[#eddcc8] md:p-8 lg:p-10"
    >
      <form
        v-if="!isUnlocked"
        class="mx-auto max-w-md space-y-4 rounded-2xl bg-[#fffaf5] p-6 ring-1 ring-[#f0dfcf]"
        @submit.prevent="unlockManagement"
      >
        <h1 class="font-serif text-2xl font-semibold text-center">Mở khóa quản lý</h1>
        <p class="text-sm text-center text-[#6f5a54]">
          Nhập mật khẩu để vào trang quản lý dữ liệu thiệp cưới.
        </p>
        <label class="block">
          <span class="mb-1 block text-sm font-medium">Mật khẩu</span>
          <input
            v-model="passwordInput"
            type="password"
            class="w-full rounded-xl border border-[#e4d5c5] bg-white px-3 py-2 outline-none focus:border-[#c99855]"
            placeholder="Nhập mật khẩu"
          />
        </label>
        <p v-if="passwordError" class="text-sm font-medium text-[#b23b3b]">
          {{ passwordError }}
        </p>
        <button
          type="submit"
          class="w-full rounded-xl bg-[#c99855] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#bb8844]"
        >
          Vào quản lý
        </button>
      </form>

      <template v-else>
        <header class="border-b border-[#efe2d4] pb-4">
          <h1 class="font-serif text-3xl font-semibold">Quản lý dữ liệu thiệp cưới</h1>
          <p class="mt-2 text-sm text-[#6f5a54]">
            Sửa thông tin đám cưới + quản lý khách mời từ một màn hình.
          </p>
        </header>

        <section class="rounded-2xl bg-[#fffaf5] p-5 ring-1 ring-[#f0dfcf]">
          <h2 class="font-serif text-xl font-semibold">Thông tin đám cưới</h2>

          <p v-if="isLoadingWedding" class="mt-3 text-sm text-[#7f6a64]">Đang tải dữ liệu...</p>

          <form
            v-else
            class="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            @submit.prevent="saveWeddingInfo"
          >
            <label class="block">
              <span class="mb-1 block text-sm font-medium">Tên chú rể</span>
              <input
                v-model="weddingForm.groomName"
                class="w-full rounded-xl border border-[#e4d5c5] bg-white px-3 py-2 outline-none focus:border-[#c99855]"
                required
              />
            </label>

            <label class="block">
              <span class="mb-1 block text-sm font-medium">Tên cô dâu</span>
              <input
                v-model="weddingForm.brideName"
                class="w-full rounded-xl border border-[#e4d5c5] bg-white px-3 py-2 outline-none focus:border-[#c99855]"
                required
              />
            </label>

            <label class="block">
              <span class="mb-1 block text-sm font-medium">Ngày cưới (bắt đầu)</span>
              <input
                v-model="weddingForm.weddingDateStart"
                type="date"
                class="w-full rounded-xl border border-[#e4d5c5] bg-white px-3 py-2 outline-none focus:border-[#c99855]"
                required
              />
            </label>

            <label class="block">
              <span class="mb-1 block text-sm font-medium">Ngày cưới (kết thúc)</span>
              <input
                v-model="weddingForm.weddingDateEnd"
                type="date"
                class="w-full rounded-xl border border-[#e4d5c5] bg-white px-3 py-2 outline-none focus:border-[#c99855]"
              />
            </label>

            <label class="block lg:col-span-2">
              <span class="mb-1 block text-sm font-medium">Ghi chú địa điểm</span>
              <input
                v-model="weddingForm.venueNote"
                class="w-full rounded-xl border border-[#e4d5c5] bg-white px-3 py-2 outline-none focus:border-[#c99855]"
                required
              />
            </label>

            <div class="md:col-span-2 lg:col-span-3 flex items-center gap-3 pt-1">
              <button
                type="submit"
                class="rounded-xl bg-[#c99855] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#bb8844]"
              >
                Lưu thông tin đám cưới
              </button>
              <p v-if="weddingSaved" class="text-sm font-semibold text-[#4f8f5a]">
                Đã lưu thành công
              </p>
            </div>
          </form>
        </section>

        <div class="grid gap-7 lg:grid-cols-[420px_1fr]">
          <!-- ── Lịch trình ─────────────────────────────────────────────────── -->
          <section class="rounded-2xl bg-[#fffaf5] p-5 ring-1 ring-[#f0dfcf]">
            <h2 class="font-serif text-xl font-semibold">Lịch trình hai bên</h2>
            <p class="mt-1 text-xs text-[#7f6a64]">
              Sau khi thêm/sửa xong, nhấn "Lưu thông tin đám cưới" ở trên để ghi vào Sheets.
            </p>

            <div class="mt-4 border-t border-[#f0dfcf] pt-4">
              <p class="mb-4 font-serif text-base font-semibold text-[#6f4f3e]">
                Thông tin và lịch trình theo từng nhà
              </p>
            </div>

            <!-- Tab chọn bên -->
            <div
              class="mt-4 grid grid-cols-2 gap-2 rounded-full bg-[#fff4e7] p-1 ring-1 ring-[#ecd8c9]"
            >
              <button
                type="button"
                class="rounded-full px-4 py-2 text-sm font-medium transition"
                :class="
                  activeTimelineSide === 'groom'
                    ? 'bg-[#c89a57] text-white shadow'
                    : 'text-[#7b6666]'
                "
                @click="selectTimelineSide('groom')"
              >
                Nhà trai
              </button>
              <button
                type="button"
                class="rounded-full px-4 py-2 text-sm font-medium transition"
                :class="
                  activeTimelineSide === 'bride'
                    ? 'bg-[#c89a57] text-white shadow'
                    : 'text-[#7b6666]'
                "
                @click="selectTimelineSide('bride')"
              >
                Nhà gái
              </button>
            </div>

            <div class="mt-5 grid gap-5 xl:grid-cols-[280px_1fr]">
              <!-- Form thêm/sửa -->
              <form
                class="space-y-3 rounded-xl border border-[#e8d5be] p-4"
                @submit.prevent="submitTimeline"
              >
                <p class="text-sm font-semibold text-[#6f4f3e]">
                  Thông tin {{ activeTimelineSide === 'groom' ? 'nhà trai' : 'nhà gái' }}
                </p>
                <label class="block">
                  <span class="mb-1 block text-xs font-medium">Tiêu đề (vd: Nhà trai)</span>
                  <input
                    v-model="familyForm[activeTimelineSide].label"
                    class="w-full rounded-lg border border-[#e4d5c5] bg-white px-3 py-2 text-sm outline-none focus:border-[#c99855]"
                  />
                </label>
                <label class="block">
                  <span class="mb-1 block text-xs font-medium">Họ tên cha</span>
                  <input
                    v-model="familyForm[activeTimelineSide].dad"
                    class="w-full rounded-lg border border-[#e4d5c5] bg-white px-3 py-2 text-sm outline-none focus:border-[#c99855]"
                  />
                </label>
                <label class="block">
                  <span class="mb-1 block text-xs font-medium">Họ tên mẹ</span>
                  <input
                    v-model="familyForm[activeTimelineSide].mom"
                    class="w-full rounded-lg border border-[#e4d5c5] bg-white px-3 py-2 text-sm outline-none focus:border-[#c99855]"
                  />
                </label>
                <label class="block">
                  <span class="mb-1 block text-xs font-medium">Địa chỉ</span>
                  <input
                    v-model="familyForm[activeTimelineSide].address"
                    class="w-full rounded-lg border border-[#e4d5c5] bg-white px-3 py-2 text-sm outline-none focus:border-[#c99855]"
                  />
                </label>
                <label class="block">
                  <span class="mb-1 block text-xs font-medium">Số điện thoại</span>
                  <input
                    v-model="familyForm[activeTimelineSide].phone"
                    type="tel"
                    class="w-full rounded-lg border border-[#e4d5c5] bg-white px-3 py-2 text-sm outline-none focus:border-[#c99855]"
                  />
                </label>
                <label class="block">
                  <span class="mb-1 block text-xs font-medium">Link Google Maps</span>
                  <input
                    v-model="familyForm[activeTimelineSide].googleMapUrl"
                    class="w-full rounded-lg border border-[#e4d5c5] bg-white px-3 py-2 text-sm outline-none focus:border-[#c99855]"
                  />
                </label>

                <div class="border-t border-[#f0dfcf] pt-3" />
              </form>
            </div>
          </section>

          <div class="space-y-7">
            <form
              class="space-y-4 rounded-2xl bg-[#fffaf5] p-5 ring-1 ring-[#f0dfcf]"
              @submit.prevent="submitGuest"
            >
              <h2 class="font-serif text-xl font-semibold">
                {{ editingSlug ? 'Chỉnh sửa khách mời' : 'Thêm khách mời' }}
              </h2>

              <label class="block">
                <span class="mb-1 block text-sm font-medium">Tên khách mời</span>
                <input
                  v-model="form.name"
                  class="w-full rounded-xl border border-[#e4d5c5] bg-white px-3 py-2 outline-none focus:border-[#c99855]"
                  placeholder="Ví dụ: Anh Minh"
                  required
                />
              </label>

              <label class="block">
                <span class="mb-1 block text-sm font-medium">Loại khách mời</span>
                <select
                  v-model="form.side"
                  class="w-full rounded-xl border border-[#e4d5c5] bg-white px-3 py-2 outline-none focus:border-[#c99855]"
                >
                  <option value="groom">Khách nhà trai</option>
                  <option value="bride">Khách nhà gái</option>
                </select>
              </label>

              <div class="flex gap-2 pt-2">
                <button
                  type="submit"
                  class="flex-1 rounded-xl bg-[#c99855] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#bb8844]"
                >
                  {{ editingSlug ? 'Cập nhật' : 'Thêm mới' }}
                </button>
                <button
                  v-if="editingSlug"
                  type="button"
                  class="rounded-xl border border-[#e1ccb5] px-4 py-2 text-sm font-semibold"
                  @click="resetForm"
                >
                  Hủy
                </button>
              </div>
            </form>

            <div class="rounded-2xl bg-[#fffdf9] p-4 ring-1 ring-[#f0e4d7] md:p-5">
              <h2 class="mb-3 font-serif text-xl font-semibold">Danh sách khách mời</h2>

              <div class="grid gap-3 lg:grid-cols-2">
                <article
                  v-for="guest in guests"
                  :key="guest.slug"
                  class="rounded-2xl border border-[#efdfcd] bg-white p-4 shadow-sm"
                >
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p class="font-semibold">{{ guest.name }}</p>
                      <p class="mt-1 text-sm text-[#7f6a64]">Slug: {{ guest.slug }}</p>
                      <p class="text-xs uppercase tracking-[0.2em] text-[#b48245]">
                        {{ sideLabel(guest.side) }}
                      </p>
                      <p class="text-xs text-[#7f6a64]">
                        Giờ mời: {{ guest.inviteTime || 'Chưa đặt' }}
                      </p>
                      <p
                        v-if="copiedSlug === guest.slug"
                        class="mt-1 text-xs font-semibold text-[#4f8f5a]"
                      >
                        Đã copy link thiệp
                      </p>
                    </div>

                    <div class="flex gap-2">
                      <a
                        class="rounded-lg border border-[#e4cfb8] px-3 py-1 text-xs font-semibold"
                        :href="`${inviteBase}/${guest.slug}`"
                        target="_blank"
                      >
                        Mở thiệp
                      </a>
                      <button
                        type="button"
                        class="rounded-lg border border-[#d9c6b0] px-3 py-1 text-xs font-semibold"
                        @click="copyInviteLink(guest.slug)"
                      >
                        Copy link
                      </button>
                      <button
                        type="button"
                        class="rounded-lg bg-[#f2e7d9] px-3 py-1 text-xs font-semibold"
                        @click="editGuest(guest)"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        class="rounded-lg bg-[#f7d9d5] px-3 py-1 text-xs font-semibold text-[#8b3d34]"
                        @click="removeGuest(guest.slug)"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </article>

                <p
                  v-if="guests.length === 0"
                  class="rounded-xl bg-white p-4 text-sm text-[#7f6a64]"
                >
                  Chưa có khách mời nào.
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </section>
  </main>
</template>
