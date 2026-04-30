<script setup lang="ts">
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import RevealOnScroll from '@/components/RevealOnScroll.vue'
import { useGuests } from '@/composables/useGuests'
import { useLazyLoad } from '@/composables/useLazyLoad'
import { fakeFetchWedding } from '@/services/fakeApi'
import type { WeddingInfo } from '@/types/invitation'
import brideImg from '@/assets/images/bride.jpg'
import groomImg from '@/assets/images/groom.jpg'
import musicCoverImg from '@/assets/images/music.jpg'
import musicSrc from '@/assets/music.mp3'

import 'swiper/css'
import 'swiper/css/pagination'

type FamilySide = 'bride' | 'groom'

const route = useRoute()
const { guests } = useGuests()

const isOpened = ref(false)
const activeFamilySide = ref<FamilySide>('groom')

watch(
  () => guests.value.find((item) => item.slug === slug.value),
  (g) => {
    if (g) activeFamilySide.value = g.side === 'bride' ? 'bride' : 'groom'
  },
  { immediate: true },
)
const audioEl = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const audioDuration = ref(0)

function togglePlay() {
  if (!audioEl.value) return
  if (isPlaying.value) {
    audioEl.value.pause()
  } else {
    audioEl.value.play()
  }
  isPlaying.value = !isPlaying.value
}

function onTimeUpdate() {
  if (!audioEl.value) return
  currentTime.value = audioEl.value.currentTime
}

function onLoadedMetadata() {
  if (!audioEl.value) return
  audioDuration.value = audioEl.value.duration
}

function seekTo(e: Event) {
  if (!audioEl.value) return
  const input = e.target as HTMLInputElement
  audioEl.value.currentTime = Number(input.value)
  currentTime.value = audioEl.value.currentTime
}

function formatTime(s: number) {
  if (!isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
const { elRef: galleryRef, isVisible: showGallery } = useLazyLoad()
const weddingInfo = ref<WeddingInfo | null>(null)

onMounted(async () => {
  weddingInfo.value = await fakeFetchWedding()
})

const slug = computed(() => String(route.params.slug || ''))

const guest = computed(() => {
  return guests.value.find((item) => item.slug === slug.value)
})

const activeFamily = computed(() => {
  if (!weddingInfo.value) return null
  return weddingInfo.value.families[activeFamilySide.value]
})

const activeTimeline = computed(() => {
  if (!weddingInfo.value) return []
  return weddingInfo.value.timelines[activeFamilySide.value]
})

const weekDayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

const calendarYear = computed(() => {
  const fromWedding = weddingInfo.value ? parseFromWeddingDate(weddingInfo.value.weddingDate) : null
  return fromWedding?.getFullYear() ?? new Date().getFullYear()
})

const calendarCells = computed(() => {
  const year = calendarYear.value
  const monthIndex = 4 // Thang 5
  // Convert JS weekday (Sun=0..Sat=6) to Monday-first index (Mon=0..Sun=6)
  const firstDay = (new Date(year, monthIndex, 1).getDay() + 6) % 7
  const totalDays = new Date(year, monthIndex + 1, 0).getDate()
  const today = new Date()

  const cells: Array<{
    day: number | null
    isWedding: boolean
    isToday: boolean
  }> = []

  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, isWedding: false, isToday: false })
  }

  for (let day = 1; day <= totalDays; day++) {
    const isWedding = day === 9 || day === 10
    const isToday =
      today.getFullYear() === year && today.getMonth() === monthIndex && today.getDate() === day
    cells.push({ day, isWedding, isToday })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ day: null, isWedding: false, isToday: false })
  }

  return cells
})

const swiperModules = [Autoplay, Pagination]

const instaCaptions = [
  'Hạnh phúc khi có bạn đồng hành trong khoảnh khắc này 🤍',
  'Một ngày thật đẹp để bắt đầu hành trình mới cùng nhau ✨',
  'Cảm ơn bạn đã đến và chia sẻ niềm vui cùng chúng mình 🥂',
  'Lưu giữ kỷ niệm ngọt ngào trong ngày trọng đại 💍',
]

const instaPosts = computed(() => {
  const images = weddingInfo.value?.galleryImages ?? []
  if (images.length === 0) return []

  const postCount = 4
  const chunkSize = Math.max(1, Math.ceil(images.length / postCount))

  return Array.from({ length: postCount }, (_, index) => {
    const start = index * chunkSize
    const group = images.slice(start, start + chunkSize)
    const fallbackImage = images[index % images.length]
    const postImages = group.length > 0 ? group : [fallbackImage]

    return {
      id: `post-${index + 1}`,
      images: postImages,
      caption: instaCaptions[index % instaCaptions.length],
      avatar: index % 2 === 0 ? groomImg : brideImg,
    }
  })
})

function openInvitation() {
  isOpened.value = true
  // Auto-play music after a short delay to let the DOM settle
  setTimeout(() => {
    if (audioEl.value) {
      audioEl.value
        .play()
        .then(() => {
          isPlaying.value = true
        })
        .catch(() => {
          // Browser may block autoplay — user can tap manually
        })
    }
  }, 600)
}

function selectFamilySide(side: FamilySide) {
  activeFamilySide.value = side
}

function guestPlaceLabel() {
  return guest.value?.side === 'bride' ? 'Tại tư gia nhà gái' : 'Tại tư gia nhà trai'
}

function normalizePhoneForTel(phone?: string) {
  const raw = String(phone ?? '').trim()
  if (!raw) return ''

  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('0')) return digits
  if (digits.startsWith('84') && digits.length > 2) return `0${digits.slice(2)}`
  return `0${digits}`
}

function parseFromInviteTime(value: string): Date | null {
  const match = value.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null
  const [, timePart, dd, mm, yyyy] = match
  if (!timePart) return null
  const [hour, minute] = timePart.split(':').map(Number)
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd), hour, minute)
}

function parseFromWeddingDate(value: string): Date | null {
  const firstDate = value.split(' - ')[0]?.trim() ?? ''
  const parts = firstDate.split('/')
  if (parts.length !== 3) return null
  const [dd, mm, yyyy] = parts.map(Number)
  if (!dd || !mm || !yyyy) return null
  return new Date(yyyy, mm - 1, dd, 8, 0)
}

const invitationMoment = computed(() => {
  const fromInvite = guest.value?.inviteTime ? parseFromInviteTime(guest.value.inviteTime) : null
  const date =
    fromInvite ?? (weddingInfo.value ? parseFromWeddingDate(weddingInfo.value.weddingDate) : null)
  if (!date) {
    return {
      weekday: 'THỨ BẢY',
      month: 'THÁNG 4',
      day: '26',
      year: '2025',
      time: '20:00',
    }
  }

  return {
    weekday: new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(date).toUpperCase(),
    month: new Intl.DateTimeFormat('vi-VN', { month: 'long' }).format(date).toUpperCase(),
    day: String(date.getDate()).padStart(2, '0'),
    year: String(date.getFullYear()),
    time: new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date),
  }
})
</script>

<template>
  <main
    class="min-h-screen bg-cover bg-center bg-fixed text-[#3e3431]"
    :style="weddingInfo ? { backgroundImage: `url(${weddingInfo.backgroundImage})` } : undefined"
  >
    <div
      class="min-h-screen bg-gradient-to-b from-[#f6f5fb]/94 via-[#fffdfa]/95 to-[#fdf7ef]/95 px-4 py-5"
    >
      <Transition name="cover">
        <section
          v-if="guest && !isOpened && weddingInfo"
          class="cover-panel mx-auto flex min-h-[92vh] w-full max-w-[520px] flex-col items-center justify-center rounded-[2rem] border border-[#efe4db] bg-white/85 px-7 text-center shadow-[0_26px_65px_-32px_rgba(73,51,49,0.85)]"
        >
          <p class="font-serif text-xs uppercase tracking-[0.45em] text-[#b48d63]">
            Wedding Invitation
          </p>

          <div
            class="name-emblem mx-auto mt-6 flex h-60 w-60 flex-col items-center justify-center rounded-full"
          >
            <p class="title-script text-5xl text-[#58413f]">{{ weddingInfo.groomName }}</p>
            <p class="my-1 text-3xl text-[#8f7a76]">&</p>
            <p class="title-script text-5xl text-[#58413f]">{{ weddingInfo.brideName }}</p>
          </div>

          <p class="mt-6 text-xl text-[#7d6960]">Trân trọng kính mời</p>

          <h2 class="title-script mt-1 text-7xl leading-none text-[#5b3f3b]">{{ guest.name }}</h2>

          <button
            class="mt-10 rounded-full border border-[#d7b076] bg-[#c89a57] px-10 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_16px_34px_-20px_rgba(131,95,45,0.9)] transition duration-500 hover:-translate-y-0.5 hover:bg-[#b98c4c] active:scale-95"
            type="button"
            @click="openInvitation"
          >
            Mở thiệp
          </button>
        </section>
      </Transition>

      <Transition name="content">
        <section
          v-if="guest && isOpened && weddingInfo"
          class="mx-auto min-h-screen w-full max-w-[560px] py-4"
        >
          <div
            class="invitation-shell rounded-[2.2rem] px-6 py-9 text-center"
            :style="{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.88), rgba(255,251,246,0.92)), url(${weddingInfo.backgroundImage})`,
            }"
          >
            <RevealOnScroll
              as="section"
              :delay="220"
              direction="left"
              class="simple-panel rounded-[1.6rem] px-6 py-8"
            >
              <p class="text-sm uppercase tracking-[0.2em] text-[#8b8078]">
                Trân trọng kính mời tham dự lễ thành hôn của
              </p>

              <div
                class="name-emblem mx-auto mt-6 flex h-56 w-56 flex-col items-center justify-center rounded-full"
              >
                <p class="title-script text-5xl text-[#58413f]">{{ weddingInfo.groomName }}</p>
                <p class="my-1 text-3xl text-[#8f7a76]">&</p>
                <p class="title-script text-5xl text-[#58413f]">{{ weddingInfo.brideName }}</p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll
              as="section"
              :delay="320"
              direction="right"
              class="mt-7 rounded-[1.6rem] bg-[#fffdfa] p-6 ring-1 ring-[#eee2d6]"
            >
              <p class="mt-5 text-s uppercase tracking-[0.22em] text-[#a08070]">
                Trân trọng kính mời
              </p>
              <p class="title-script mt-1 text-7xl leading-none text-[#5b3f3b]">{{ guest.name }}</p>
              <p class="mt-3 text-s leading-relaxed text-[#7b6666]">Tham dự lễ thành hôn</p>
              <p class="mt-1 text-s uppercase tracking-[0.22em] text-[#b17e3a]">
                {{ guestPlaceLabel() }}
              </p>

              <!-- Top decoration -->
              <div class="flex items-center justify-center gap-3 text-[#c89a57]">
                <div class="h-0.5 flex-1 bg-gradient-to-r from-transparent to-[#c89a57]" />
                <div class="text-xl">✦</div>
                <div class="h-0.5 flex-1 bg-gradient-to-l from-transparent to-[#c89a57]" />
              </div>

              <p class="mt-4 text-sm font-semibold tracking-[0.18em] text-[#8f7f6f]">
                {{ invitationMoment.month }}
              </p>

              <div class="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div
                  class="border-t border-[#d8c7ad] pt-2 text-center text-2xl font-semibold text-[#4d4a46]"
                >
                  {{ invitationMoment.weekday }}
                </div>

                <div class="px-2 text-center">
                  <p class="text-7xl font-semibold leading-none text-[#8c6ca7]">
                    {{ invitationMoment.day }}
                  </p>
                </div>

                <div
                  class="border-t border-[#d8c7ad] pt-2 text-center text-2xl font-semibold text-[#4d4a46]"
                >
                  LÚC {{ invitationMoment.time }}
                </div>
              </div>

              <p class="mt-3 text-sm font-semibold tracking-[0.16em] text-[#8f7f6f]">
                {{ invitationMoment.year }}
              </p>

              <p class="mt-2 text-lg font-bold tracking-[0.08em] text-[#7d5630]">Âm lịch: 24/3</p>

              <!-- Bottom decoration -->
              <div class="mt-4 flex items-center justify-center gap-3 text-[#c89a57]">
                <div class="h-0.5 flex-1 bg-gradient-to-r from-transparent to-[#c89a57]" />
                <div class="text-xl">✦</div>
                <div class="h-0.5 flex-1 bg-gradient-to-l from-transparent to-[#c89a57]" />
              </div>

              <p class="mt-3 text-s leading-relaxed text-[#7b6666]">
                Sự có mặt của bạn là niềm vinh dự cho gia đình chúng tôi
              </p>
            </RevealOnScroll>
            <!-- Music Player -->
            <RevealOnScroll as="section" :delay="420" direction="right" class="mt-8">
              <audio
                ref="audioEl"
                :src="musicSrc"
                loop
                preload="metadata"
                @timeupdate="onTimeUpdate"
                @loadedmetadata="onLoadedMetadata"
                @ended="isPlaying = false"
              />
              <div
                class="mx-auto max-w-sm overflow-hidden rounded-3xl bg-white px-6 pb-6 pt-8 shadow-[0_12px_40px_-16px_rgba(72,33,33,0.3)] ring-1 ring-[#f0dfd4]"
              >
                <!-- Rotating album art -->
                <div class="flex justify-center">
                  <div
                    class="relative h-52 w-52 rounded-full"
                    :class="isPlaying ? 'album-spin' : 'album-paused'"
                  >
                    <!-- Outer decorative ring -->
                    <div class="absolute -inset-2 rounded-full border-2 border-[#d9c8ad]/60" />
                    <!-- Inner shadow ring -->
                    <div
                      class="absolute -inset-0.5 rounded-full shadow-[inset_0_0_20px_rgba(72,33,33,0.15)]"
                    />
                    <img
                      :src="musicCoverImg"
                      alt="Album art"
                      class="h-52 w-52 rounded-full object-cover"
                    />
                    <!-- Center hole like a vinyl record -->
                    <div
                      class="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-inner ring-2 ring-[#d9c8ad]"
                    />
                  </div>
                </div>

                <!-- Song info -->
                <div class="mt-6 flex items-start justify-between">
                  <div class="text-left">
                    <p class="text-base font-bold text-[#1a1a1a]">Story love</p>
                    <p class="mt-0.5 text-sm text-[#9b8070]">
                      {{ weddingInfo.groomName }} &amp; {{ weddingInfo.brideName }}
                    </p>
                  </div>
                  <!-- Heart -->
                  <svg
                    class="mt-0.5 h-6 w-6 flex-shrink-0 text-[#b83a3a]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35z"
                    />
                  </svg>
                </div>

                <!-- Progress bar -->
                <div class="mt-4">
                  <input
                    type="range"
                    class="music-range w-full"
                    :value="currentTime"
                    :max="audioDuration || 100"
                    :style="{
                      '--pct': audioDuration ? `${(currentTime / audioDuration) * 100}%` : '0%',
                    }"
                    step="0.5"
                    @input="seekTo"
                  />
                  <div class="mt-1.5 flex justify-between text-xs text-[#9b8070]">
                    <span>{{ formatTime(currentTime) }}</span>
                    <span>{{ formatTime(audioDuration) }}</span>
                  </div>
                </div>

                <!-- Controls -->
                <div class="mt-5 flex items-center justify-between">
                  <!-- Shuffle (decorative) -->
                  <button type="button" class="p-1 text-[#9b8070] transition active:scale-90">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"
                      />
                    </svg>
                  </button>
                  <!-- Prev (decorative) -->
                  <button type="button" class="p-1 text-[#3e3431] transition active:scale-90">
                    <svg class="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                    </svg>
                  </button>
                  <!-- Play / Pause — main button -->
                  <button
                    type="button"
                    class="flex h-14 w-14 items-center justify-center rounded-full bg-[#1a1a1a] text-white shadow-lg transition active:scale-95"
                    @click="togglePlay"
                  >
                    <svg
                      v-if="!isPlaying"
                      class="h-7 w-7 translate-x-0.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <svg v-else class="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  </button>
                  <!-- Next (decorative) -->
                  <button type="button" class="p-1 text-[#3e3431] transition active:scale-90">
                    <svg class="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
                    </svg>
                  </button>
                  <!-- Repeat (decorative) -->
                  <button type="button" class="p-1 text-[#9b8070] transition active:scale-90">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </RevealOnScroll>

            <!-- Bride and Groom Section -->
            <div class="mx-auto mt-12 max-w-lg space-y-8">
              <div class="flex items-center justify-center gap-3 text-[#c89a57]">
                <div class="h-0.5 flex-1 bg-gradient-to-r from-transparent to-[#c89a57]" />
                <p class="font-serif text-xs uppercase tracking-[0.35em] text-[#b48d63]">
                  Chúng tôi là
                </p>
                <div class="h-0.5 flex-1 bg-gradient-to-l from-transparent to-[#c89a57]" />
              </div>
              <!-- Groom Section: slides in from LEFT -->
              <RevealOnScroll as="div" :delay="700" direction="left">
                <div class="relative flex items-center justify-between gap-6">
                  <!-- Groom Label -->
                  <div
                    class="flex flex-shrink-0 flex-col items-center gap-0.5 rounded-[2rem] bg-[#b83a3a] px-3 py-5 shadow-lg"
                  >
                    <span
                      class="font-serif text-xs font-semibold uppercase tracking-widest text-white"
                      >Chú</span
                    >
                    <span
                      class="font-serif text-xs font-semibold uppercase tracking-widest text-white"
                      >Rể</span
                    >
                    <span class="mt-1 block w-4 border-t border-white/40" />
                    <span
                      v-for="word in weddingInfo.groomName.split(' ')"
                      :key="word"
                      class="font-serif text-xs font-semibold uppercase tracking-widest text-white"
                      >{{ word }}</span
                    >
                  </div>

                  <!-- Groom Image -->
                  <div class="relative inline-block flex-shrink-0">
                    <div class="absolute -inset-1 rounded-full border-2 border-[#d9c8ad]" />
                    <img
                      :src="groomImg"
                      :alt="weddingInfo.groomName"
                      class="relative h-72 w-56 rounded-full border-4 border-white object-cover shadow-xl"
                    />
                  </div>

                  <!-- Left decoration -->
                  <div class="absolute left-0 top-1/2 text-2xl text-[#d9c8ad]">✦</div>
                </div>
              </RevealOnScroll>

              <!-- Bride Section: slides in from RIGHT -->
              <RevealOnScroll as="div" :delay="800" direction="right">
                <div class="relative flex items-center justify-between gap-6">
                  <!-- Bride Image -->
                  <div class="relative inline-block flex-shrink-0">
                    <div class="absolute -inset-1 rounded-full border-2 border-[#d9c8ad]" />
                    <img
                      :src="brideImg"
                      :alt="weddingInfo.brideName"
                      class="relative h-72 w-56 rounded-full border-4 border-white object-cover shadow-xl"
                    />
                  </div>

                  <!-- Bride Label -->
                  <div
                    class="flex flex-shrink-0 flex-col items-center gap-0.5 rounded-[2rem] bg-[#b83a3a] px-3 py-5 shadow-lg"
                  >
                    <span
                      class="font-serif text-xs font-semibold uppercase tracking-widest text-white"
                      >Cô</span
                    >
                    <span
                      class="font-serif text-xs font-semibold uppercase tracking-widest text-white"
                      >Dâu</span
                    >
                    <span class="mt-1 block w-4 border-t border-white/40" />
                    <span
                      v-for="word in weddingInfo.brideName.split(' ')"
                      :key="word"
                      class="font-serif text-xs font-semibold uppercase tracking-widest text-white"
                      >{{ word }}</span
                    >
                  </div>

                  <!-- Right decoration -->
                  <div class="absolute right-0 top-1/2 text-2xl text-[#d9c8ad]">✦</div>
                </div>
              </RevealOnScroll>
            </div>

            <RevealOnScroll
              as="section"
              :delay="740"
              direction="left"
              class="mt-7 rounded-3xl bg-[#fffaf6] p-5 ring-1 ring-[#f0dfd4]"
            >
              <div class="flex items-center justify-between">
                <p class="text-xs uppercase tracking-[0.3em] text-[#b48d63]">Lịch cưới</p>
                <p class="text-sm font-semibold text-[#7f6a64]">Tháng 5 / {{ calendarYear }}</p>
              </div>

              <div class="mt-4 grid grid-cols-7 gap-2 text-center">
                <p
                  v-for="label in weekDayLabels"
                  :key="label"
                  class="text-xs font-semibold uppercase tracking-[0.12em] text-[#a08a7e]"
                >
                  {{ label }}
                </p>

                <div
                  v-for="(cell, idx) in calendarCells"
                  :key="`calendar-${idx}`"
                  class="flex h-10 items-center justify-center rounded-full text-sm font-medium"
                  :class="
                    !cell.day
                      ? 'text-transparent'
                      : cell.isWedding
                        ? 'bg-[#c89a57] text-white shadow'
                        : cell.isToday
                          ? 'bg-[#fde8d3] font-semibold text-[#8a5e35] ring-1 ring-[#e5bf96]'
                          : 'text-[#6f5a54]'
                  "
                >
                  {{ cell.day || '•' }}
                </div>
              </div>

              <div
                class="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-[#7f6a64]"
              >
                <span class="inline-flex items-center gap-1.5">
                  <span class="h-2.5 w-2.5 rounded-full bg-[#c89a57]" />
                  Ngày cưới 9-10/5
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <span class="h-2.5 w-2.5 rounded-full bg-[#fde8d3] ring-1 ring-[#e5bf96]" />
                  Ngày hiện tại
                </span>
              </div>
            </RevealOnScroll>

            <RevealOnScroll
              as="section"
              :delay="760"
              direction="right"
              class="mt-7 rounded-3xl bg-[#fffaf6] p-5 ring-1 ring-[#f0dfd4]"
            >
              <p class="text-xs uppercase tracking-[0.3em] text-[#b48d63]">
                Thông tin và lịch trình
              </p>

              <div
                class="mt-4 grid grid-cols-2 gap-2 rounded-full bg-[#fff4e7] p-1 ring-1 ring-[#ecd8c9]"
              >
                <button
                  class="rounded-full px-4 py-2 text-sm font-medium transition"
                  :class="
                    activeFamilySide === 'groom'
                      ? 'bg-[#c89a57] text-white shadow'
                      : 'text-[#7b6666]'
                  "
                  type="button"
                  @click="selectFamilySide('groom')"
                >
                  Nhà trai
                </button>

                <button
                  class="rounded-full px-4 py-2 text-sm font-medium transition"
                  :class="
                    activeFamilySide === 'bride'
                      ? 'bg-[#c89a57] text-white shadow'
                      : 'text-[#7b6666]'
                  "
                  type="button"
                  @click="selectFamilySide('bride')"
                >
                  Nhà gái
                </button>
              </div>

              <div class="mt-4">
                <Transition name="family-switch" mode="out-in">
                  <div
                    v-if="activeFamily"
                    :key="`family-${activeFamilySide}`"
                    class="rounded-3xl bg-white/80 p-5 text-left ring-1 ring-[#f3e4d9]"
                  >
                    <p class="font-serif text-lg font-semibold text-[#5a433d]">
                      {{ activeFamily.label }}
                    </p>

                    <p class="mt-3 text-sm leading-6 text-[#7b6666]">Ông: {{ activeFamily.dad }}</p>

                    <p class="text-sm leading-6 text-[#7b6666]">Bà : {{ activeFamily.mom }}</p>

                    <p class="mt-3 text-sm leading-6 text-[#7b6666]">
                      Tại: {{ activeFamily.address }}
                    </p>

                    <div class="mt-4 flex gap-2">
                      <a
                        :href="`tel:${normalizePhoneForTel(activeFamily.phone)}`"
                        class="flex-1 rounded-full bg-[#fff8ef] px-4 py-2 text-center text-sm font-medium text-[#a17438] ring-1 ring-[#eed9c4] transition hover:bg-[#fff1de]"
                      >
                        Gọi
                      </a>

                      <a
                        :href="activeFamily.googleMapUrl"
                        class="flex-1 rounded-full bg-[#c89a57] px-4 py-2 text-center text-sm font-medium text-white shadow transition hover:bg-[#b98b4b]"
                        target="_blank"
                      >
                        Bản đồ
                      </a>
                    </div>
                  </div>
                </Transition>

                <div class="mt-5 space-y-3 text-left">
                  <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[#b17e3a]">
                    Lịch trình {{ activeFamilySide === 'groom' ? 'nhà trai' : 'nhà gái' }}
                  </p>
                  <Transition name="side-switch" mode="out-in">
                    <div :key="activeFamilySide" class="space-y-3">
                      <div
                        v-for="(item, index) in activeTimeline"
                        :key="`${activeFamilySide}-${item.time}-${item.title}-${index}`"
                        class="timeline-card relative rounded-3xl p-5 pl-7"
                        :style="{ transitionDelay: `${300 + index * 140}ms` }"
                      >
                        <div class="absolute left-3 top-6 h-3 w-3 rounded-full bg-[#c89a57]" />

                        <p class="text-sm font-semibold tracking-wide text-[#b17e3a]">
                          {{ item.time }} · {{ item.date }}
                        </p>

                        <h3 class="mt-2 font-serif text-lg font-semibold text-[#4f3d39]">
                          {{ item.title }}
                        </h3>

                        <p class="mt-1 text-sm leading-6 text-[#7b6660]">
                          {{ item.description }}
                        </p>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll as="section" :delay="840" direction="left" class="mt-8">
              <div class="flex items-center justify-center gap-3 text-[#c89a57]">
                <div class="h-0.5 flex-1 bg-gradient-to-r from-transparent to-[#c89a57]" />
                <p class="font-serif text-xs uppercase tracking-[0.35em] text-[#b48d63]">
                  Khoảnh khắc
                </p>
                <div class="h-0.5 flex-1 bg-gradient-to-l from-transparent to-[#c89a57]" />
              </div>

              <div
                ref="galleryRef"
                class="gallery-frame mt-4 overflow-hidden rounded-[1.6rem] border-2 border-[#d4b896] bg-white shadow-lg"
              >
                <div
                  v-if="!showGallery"
                  class="h-[42rem] animate-pulse rounded-[1.6rem] bg-[#f2dfd8]"
                />

                <div v-else class="space-y-6 px-3 py-4 sm:px-4">
                  <article v-for="post in instaPosts" :key="post.id">
                    <div
                      class="mx-auto max-w-sm overflow-hidden rounded-2xl bg-white ring-1 ring-[#f0dfd4]"
                    >
                      <div class="flex items-center gap-3 px-4 py-3">
                        <div class="relative h-9 w-9 flex-shrink-0">
                          <img
                            :src="post.avatar"
                            alt="avatar"
                            class="h-9 w-9 rounded-full object-cover ring-2 ring-[#c89a57] ring-offset-1"
                          />
                        </div>
                        <div class="flex flex-1 flex-col text-left">
                          <p class="text-sm font-semibold leading-none text-[#3e3431]">
                            {{ weddingInfo.groomName }} &amp; {{ weddingInfo.brideName }}
                          </p>
                          <p class="mt-0.5 text-xs text-[#9b8070]">
                            {{ weddingInfo.weddingDate }}
                          </p>
                        </div>
                        <svg class="h-5 w-5 text-[#9b8070]" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="5" cy="12" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="19" cy="12" r="1.5" />
                        </svg>
                      </div>

                      <Swiper
                        :autoplay="
                          post.images.length > 1
                            ? { delay: 4600, disableOnInteraction: false }
                            : false
                        "
                        :loop="post.images.length > 1"
                        :modules="swiperModules"
                        :nested="true"
                        :pagination="post.images.length > 1"
                        :speed="950"
                        class="insta-post-swiper w-full"
                      >
                        <SwiperSlide v-for="image in post.images" :key="`${post.id}-${image}`">
                          <div class="aspect-square w-full overflow-hidden bg-[#f2dfd8]">
                            <img
                              :src="image"
                              alt="Ảnh cưới"
                              class="insta-slide-image h-full w-full object-cover"
                            />
                          </div>
                        </SwiperSlide>
                      </Swiper>

                      <div class="flex items-center gap-4 px-4 pt-3">
                        <svg class="h-6 w-6 text-[#b83a3a]" fill="currentColor" viewBox="0 0 24 24">
                          <path
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35z"
                          />
                        </svg>
                        <svg
                          class="h-6 w-6 text-[#9b8070]"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.8"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                        <svg
                          class="h-6 w-6 text-[#9b8070]"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.8"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </div>

                      <div class="px-4 pb-4 pt-2 text-left">
                        <p class="text-sm leading-relaxed text-[#3e3431]">
                          <span class="font-semibold">{{ weddingInfo.groomName }}</span>
                          {{ ' ' }}{{ post.caption }}
                        </p>
                        <p class="mt-1 text-xs text-[#9b8070]">{{ weddingInfo.venue.name }}</p>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </RevealOnScroll>

            <!-- Thank You + QR Section -->
            <RevealOnScroll as="section" :delay="960" direction="up" class="mt-10 pb-4">
              <!-- Divider -->
              <div class="flex items-center justify-center gap-3 text-[#c89a57]">
                <div class="h-0.5 flex-1 bg-gradient-to-r from-transparent to-[#c89a57]" />
                <span class="text-xl">✦</span>
                <div class="h-0.5 flex-1 bg-gradient-to-l from-transparent to-[#c89a57]" />
              </div>

              <!-- Thank you message -->
              <div class="mt-8 px-2 text-center">
                <p class="title-script text-5xl text-[#6f4f4a]">Cảm ơn bạn</p>
                <p class="mt-4 text-sm leading-7 text-[#7b6666]">
                  Thật vui vì được đón tiếp mọi người trong một dịp đặc biệt như đám cưới của chúng
                  tôi. Chúng tôi muốn gửi đến bạn những lời cảm ơn sâu sắc nhất và để bạn biết chúng
                  tôi rất hạnh phúc khi thấy bạn ở đó. Cảm ơn các bạn rất nhiều vì sự hiện diện cùng
                  những lời chúc tốt đẹp mà bạn đã dành cho chúng tôi.
                </p>
                <p class="mt-3 text-sm leading-7 text-[#7b6666]">
                  Kết hôn không chỉ là chuyện hai người đến với nhau, mà là sự lựa chọn người sẽ
                  đồng hành cùng bạn suốt đời. Là người bạn sẵn sàng chia sẻ mọi niềm vui, gánh vác
                  mọi nỗi buồn, và cùng nhau xây dựng một tương lai hạnh phúc. Chọn đúng người, đó
                  mới là một hành trình đầy yêu thương và thấu hiểu.
                </p>
              </div>

              <!-- QR transfer -->
              <div
                v-if="weddingInfo.bankAccount"
                class="mx-auto mt-8 max-w-xs overflow-hidden rounded-3xl bg-white ring-1 ring-[#f0dfd4] shadow-[0_12px_40px_-16px_rgba(72,33,33,0.25)]"
              >
                <!-- Card header -->
                <div class="bg-[#c89a57] px-5 py-3 text-center">
                  <p class="text-xs font-semibold uppercase tracking-[0.3em] text-white">
                    Mừng cưới chuyển khoản
                  </p>
                </div>

                <!-- QR image -->
                <div class="flex justify-center px-6 pt-6">
                  <img
                    :src="`https://img.vietqr.io/image/${weddingInfo.bankAccount.bankId}-${weddingInfo.bankAccount.accountNumber}-compact2.png?accountName=${encodeURIComponent(weddingInfo.bankAccount.accountName)}`"
                    alt="QR chuyển khoản"
                    class="h-52 w-52 rounded-2xl object-contain"
                    loading="lazy"
                  />
                </div>

                <!-- Account info -->
                <div class="px-6 pb-6 pt-4 text-center">
                  <p class="text-xs uppercase tracking-[0.25em] text-[#b48d63]">
                    {{ weddingInfo.bankAccount.bankName }}
                  </p>
                  <p class="mt-1 font-mono text-xl font-bold tracking-widest text-[#3e3431]">
                    {{ weddingInfo.bankAccount.accountNumber }}
                  </p>
                  <p class="mt-1 text-sm font-medium text-[#56413d]">
                    {{ weddingInfo.bankAccount.accountName }}
                  </p>
                </div>
              </div>

              <!-- Closing message -->
              <p class="mt-8 text-center text-xs leading-6 text-[#a09080] italic">
                {{ weddingInfo.groomName }} &amp; {{ weddingInfo.brideName }} ·
                {{ weddingInfo.weddingDate }}
              </p>
            </RevealOnScroll>
          </div>
        </section>
      </Transition>

      <section
        v-if="!weddingInfo"
        class="flex min-h-screen items-center justify-center px-6 text-center"
      >
        <div class="rounded-3xl bg-white/95 p-6 shadow-lg ring-1 ring-[#f0dad3]">
          <p class="text-sm text-[#7b6666]">Đang tải ...</p>
        </div>
      </section>

      <section
        v-else-if="!guest"
        class="flex min-h-screen items-center justify-center px-6 text-center"
      >
        <div class="rounded-3xl bg-white/95 p-6 shadow-lg ring-1 ring-[#f0dad3]">
          <h1 class="font-serif text-2xl font-semibold">Không tìm thấy thiệp mời</h1>

          <p class="mt-2 text-sm text-[#7b6666]">Link thiệp mời không đúng hoặc chưa được tạo.</p>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.title-script {
  font-family: 'Great Vibes', cursive;
  line-height: 1.1;
}

.cover-panel {
  animation: floatingIn 1.1s cubic-bezier(0.22, 1, 0.36, 1);
}

.invitation-shell {
  position: relative;
  background-color: rgba(255, 255, 255, 0.96);
  background-size: cover;
  background-position: center;
  box-shadow:
    0 34px 85px -50px rgba(72, 33, 33, 0.82),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(242, 227, 214, 0.95);
}

.ornament-panel {
  position: relative;
  background:
    radial-gradient(circle at 10% 10%, rgba(244, 226, 247, 0.45) 0%, transparent 38%),
    radial-gradient(circle at 90% 10%, rgba(220, 236, 248, 0.42) 0%, transparent 42%), #fff;
  border: 1px solid #f2e3d6;
}

.simple-panel {
  background: #fff;
  border: 1px solid #f0e3d5;
}

.gallery-frame {
  box-shadow:
    0 8px 24px -12px rgba(104, 58, 58, 0.4),
    inset 0 0 0 2px rgba(212, 184, 150, 0.3);
}

.name-emblem {
  border: 2px solid #d9c8ad;
  box-shadow: inset 0 0 0 8px rgba(255, 255, 255, 0.95);
}

.timeline-card {
  background: #ffffff;
  box-shadow: 0 14px 26px -22px rgba(104, 58, 58, 0.85);
  border: 1px solid #f4e5d8;
}

.vertical-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  letter-spacing: 0.1em;
}

.music-range {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(to right, #1a1a1a var(--pct, 0%), #e5e5e5 var(--pct, 0%));
  outline: none;
  cursor: pointer;
}

.music-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #1a1a1a;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.music-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: none;
  border-radius: 50%;
  background: #1a1a1a;
  cursor: pointer;
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.album-spin {
  animation: spin-slow 12s linear infinite;
}

.album-paused {
  animation: spin-slow 12s linear infinite;
  animation-play-state: paused;
}

.cover-enter-active,
.cover-leave-active,
.content-enter-active {
  transition:
    opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}

.cover-enter-from,
.cover-leave-to,
.content-enter-from {
  opacity: 0;
  transform: translateY(28px) scale(0.985);
}

.family-enter-active,
.family-leave-active {
  transition:
    opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.family-enter-from {
  opacity: 0;
  transform: translateY(14px);
}

.family-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.side-switch-enter-active,
.side-switch-leave-active {
  transition:
    opacity 0.68s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.68s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.side-switch-enter-from {
  opacity: 0;
  transform: translateX(20px) scale(0.985);
}

.side-switch-leave-to {
  opacity: 0;
  transform: translateX(-20px) scale(0.985);
}

.family-switch-enter-active,
.family-switch-leave-active {
  transition:
    opacity 0.62s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.62s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.family-switch-enter-from {
  opacity: 0;
  transform: translateY(14px) scale(0.985);
}

.family-switch-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.985);
}

.insta-slide-image {
  transform: scale(1.035);
  transition: transform 1s cubic-bezier(0.22, 1, 0.36, 1);
}

:deep(.insta-post-swiper .swiper-slide) {
  opacity: 0.55;
  transition: opacity 0.8s ease;
}

:deep(.insta-post-swiper .swiper-slide-active) {
  opacity: 1;
}

:deep(.insta-post-swiper .swiper-slide-active .insta-slide-image) {
  transform: scale(1);
}

@keyframes floatingIn {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cover-panel,
  .timeline-card,
  .invitation-shell,
  .ornament-panel {
    animation: none !important;
    transition: none !important;
  }

  .side-switch-enter-active,
  .side-switch-leave-active,
  .family-switch-enter-active,
  .family-switch-leave-active,
  .insta-slide-image {
    transition: none !important;
  }
}
</style>
