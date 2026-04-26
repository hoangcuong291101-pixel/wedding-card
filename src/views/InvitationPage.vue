<script setup lang="ts">
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import RevealOnScroll from '@/components/RevealOnScroll.vue'
import { useGuests } from '@/composables/useGuests'
import { useLazyLoad } from '@/composables/useLazyLoad'
import { weddingInfo } from '@/data/wedding'

import 'swiper/css'
import 'swiper/css/pagination'

type FamilySide = 'bride' | 'groom'

const route = useRoute()
const { guests } = useGuests()

const isOpened = ref(false)
const activeFamilySide = ref<FamilySide>('groom')
const { elRef: galleryRef, isVisible: showGallery } = useLazyLoad()

const slug = computed(() => String(route.params.slug || ''))

const guest = computed(() => {
  return guests.value.find((item) => item.slug === slug.value)
})

const activeFamily = computed(() => {
  return weddingInfo.families[activeFamilySide.value]
})

const swiperModules = [Autoplay, Pagination]

function openInvitation() {
  isOpened.value = true
}

function selectFamilySide(side: FamilySide) {
  activeFamilySide.value = side
}

function guestSideLabel() {
  return guest.value?.side === 'bride' ? 'Khách nhà gái' : 'Khách nhà trai'
}
</script>

<template>
  <main
    class="min-h-screen bg-cover bg-center bg-fixed text-[#3e3431]"
    :style="{ backgroundImage: `url(${weddingInfo.backgroundImage})` }"
  >
    <div class="min-h-screen bg-gradient-to-b from-[#f6f5fb]/94 via-[#fffdfa]/95 to-[#fdf7ef]/95 px-4 py-5">
      <Transition name="cover">
        <section
          v-if="guest && !isOpened"
          class="cover-panel mx-auto flex min-h-[92vh] w-full max-w-[520px] flex-col items-center justify-center rounded-[2rem] border border-[#efe4db] bg-white/85 px-7 text-center shadow-[0_26px_65px_-32px_rgba(73,51,49,0.85)]"
        >
          <p class="font-serif text-xs uppercase tracking-[0.45em] text-[#b48d63]">Wedding Invitation</p>

          <h1 class="mt-4 text-5xl text-[#6f4f4a] title-script">
            {{ weddingInfo.groomName }}
            <span class="mx-2 inline-block text-3xl">&</span>
            {{ weddingInfo.brideName }}
          </h1>

          <p class="mt-6 text-sm text-[#7d6960]">Trân trọng kính mời</p>

          <h2 class="mt-2 font-serif text-3xl font-semibold text-[#56413d]">
            {{ guest.name }}
          </h2>

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
        <section v-if="guest && isOpened" class="mx-auto min-h-screen w-full max-w-[560px] py-4">
          <div class="invitation-shell rounded-[2.2rem] px-6 py-9 text-center">
            <RevealOnScroll as="section" :delay="220" direction="left" class="ornament-panel rounded-[1.6rem] px-6 py-8">
              <p class="font-serif text-xs uppercase tracking-[0.45em] text-[#b48d63]">Save the date</p>

              <h1 class="mt-4 text-5xl text-[#654742] title-script">
                {{ weddingInfo.groomName }}
                <span class="mx-2 inline-block text-3xl">&</span>
                {{ weddingInfo.brideName }}
              </h1>
            </RevealOnScroll>

            <RevealOnScroll as="section" :delay="320" direction="right" class="mt-7 rounded-[1.6rem] bg-[#fff8f0] p-5 ring-1 ring-[#f0dfd3]">
              <p class="text-sm text-[#7b6666]">Trân trọng kính mời</p>

              <h2 class="mt-2 font-serif text-3xl font-semibold text-[#5d4440]">
                {{ guest.name }}
              </h2>

              <p class="mt-1 text-xs uppercase tracking-[0.22em] text-[#b17e3a]">
                {{ guestSideLabel() }}
              </p>
            </RevealOnScroll>

            <RevealOnScroll as="section" :delay="430" direction="left" class="mt-7 rounded-[1.6rem] bg-[#fff8f0] p-5 ring-1 ring-[#f0dfd3]">
              <p class="text-xs uppercase tracking-[0.3em] text-[#b48d63]">Thời gian</p>

              <p class="mt-2 font-serif text-2xl font-semibold text-[#64453e]">
                {{ weddingInfo.weddingDate }}
              </p>

              <p class="mt-2 text-sm leading-6 text-[#7b6666]">
                {{ weddingInfo.venue.note }}
              </p>
            </RevealOnScroll>

            <RevealOnScroll as="section" :delay="540" direction="right" class="mt-7 rounded-3xl bg-[#fffaf4] p-5 text-left ring-1 ring-[#efdfd3]">
              <p class="text-center font-serif text-xs uppercase tracking-[0.35em] text-[#b48d63]">
                Lịch trình
              </p>

              <div class="mt-5 space-y-4">
                <div
                  v-for="(item, index) in weddingInfo.timeline"
                  :key="`${item.time}-${item.title}`"
                  class="timeline-card relative rounded-3xl p-5 pl-7"
                  :style="{ transitionDelay: `${300 + index * 170}ms` }"
                >
                  <div class="absolute left-3 top-6 h-3 w-3 rounded-full bg-[#c89a57]" />

                  <p class="text-sm font-semibold tracking-wide text-[#b17e3a]">
                    {{ item.time }}
                  </p>

                  <h3 class="mt-2 font-serif text-lg font-semibold text-[#4f3d39]">
                    {{ item.title }}
                  </h3>

                  <p class="mt-1 text-sm leading-6 text-[#7b6660]">
                    {{ item.description }}
                  </p>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll as="section" :delay="650" direction="left" class="mt-8">
              <p class="font-serif text-xs uppercase tracking-[0.35em] text-[#b48d63]">Khoảnh khắc</p>

              <div ref="galleryRef" class="mt-4 overflow-hidden rounded-[1.6rem] border border-[#f2e4d8] shadow-lg">
                <div v-if="!showGallery" class="h-64 animate-pulse rounded-[1.6rem] bg-[#f2dfd8]" />

                <Swiper
                  v-else
                  :autoplay="{ delay: 3200, disableOnInteraction: false }"
                  :loop="true"
                  :modules="swiperModules"
                  :pagination="true"
                  class="w-full"
                >
                  <SwiperSlide v-for="image in weddingInfo.galleryImages" :key="image">
                    <img
                      :src="image"
                      alt="Ảnh cưới"
                      class="h-64 w-full object-cover"
                      loading="lazy"
                    />
                  </SwiperSlide>
                </Swiper>
              </div>
            </RevealOnScroll>

            <RevealOnScroll as="section" :delay="760" direction="right" class="mt-7 rounded-3xl bg-[#fffaf6] p-5 ring-1 ring-[#f0dfd4]">
              <p class="text-xs uppercase tracking-[0.3em] text-[#b48d63]">Thông tin 2 nhà</p>

              <div class="mt-4 grid grid-cols-2 gap-2 rounded-full bg-[#fff4e7] p-1 ring-1 ring-[#ecd8c9]">
                <button
                  class="rounded-full px-4 py-2 text-sm font-medium transition"
                  :class="activeFamilySide === 'groom' ? 'bg-[#c89a57] text-white shadow' : 'text-[#7b6666]'"
                  type="button"
                  @click="selectFamilySide('groom')"
                >
                  Nhà trai
                </button>

                <button
                  class="rounded-full px-4 py-2 text-sm font-medium transition"
                  :class="activeFamilySide === 'bride' ? 'bg-[#c89a57] text-white shadow' : 'text-[#7b6666]'"
                  type="button"
                  @click="selectFamilySide('bride')"
                >
                  Nhà gái
                </button>
              </div>

              <Transition name="family" mode="out-in">
                <div :key="activeFamilySide" class="mt-4 rounded-3xl bg-white/80 p-5 text-left ring-1 ring-[#f3e4d9]">
                  <p class="font-serif text-lg font-semibold text-[#5a433d]">
                    {{ activeFamily.label }}
                  </p>

                  <p class="mt-3 text-sm leading-6 text-[#7b6666]">
                    {{ activeFamily.dad }}
                  </p>

                  <p class="text-sm leading-6 text-[#7b6666]">
                    {{ activeFamily.mom }}
                  </p>

                  <p class="mt-3 text-sm leading-6 text-[#7b6666]">
                    {{ activeFamily.address }}
                  </p>

                  <div class="mt-4 flex gap-2">
                    <a
                      :href="`tel:${activeFamily.phone}`"
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
            </RevealOnScroll>
          </div>
        </section>
      </Transition>

      <section v-if="!guest" class="flex min-h-screen items-center justify-center px-6 text-center">
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
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 251, 246, 0.97) 100%);
  box-shadow:
    0 34px 85px -50px rgba(72, 33, 33, 0.82),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(242, 227, 214, 0.95);
}

.ornament-panel {
  position: relative;
  background: radial-gradient(circle at 10% 10%, rgba(244, 226, 247, 0.45) 0%, transparent 38%),
    radial-gradient(circle at 90% 10%, rgba(220, 236, 248, 0.42) 0%, transparent 42%),
    #fff;
  border: 1px solid #f2e3d6;
}

.timeline-card {
  background: #ffffff;
  box-shadow: 0 14px 26px -22px rgba(104, 58, 58, 0.85);
  border: 1px solid #f4e5d8;
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
}
</style>
