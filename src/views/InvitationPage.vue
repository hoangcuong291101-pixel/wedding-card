<script setup lang="ts">
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import RevealOnScroll from '@/components/RevealOnScroll.vue'
import { guests } from '@/data/guests'
import { weddingInfo } from '@/data/wedding'
import { useLazyLoad } from '@/composables/useLazyLoad'

import 'swiper/css'
import 'swiper/css/pagination'

type FamilySide = 'bride' | 'groom'

const route = useRoute()

const isOpened = ref(false)
const activeFamilySide = ref<FamilySide>('groom')

const { elRef: galleryRef, isVisible: showGallery } = useLazyLoad()

const slug = computed(() => String(route.params.slug || ''))

const guest = computed(() => {
  return guests.find((item) => item.slug === slug.value)
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
</script>

<template>
  <main
    class="min-h-screen bg-cover bg-center bg-fixed text-[#3b2f2f]"
    :style="{ backgroundImage: `url(${weddingInfo.backgroundImage})` }"
  >
    <div class="min-h-screen bg-gradient-to-b from-[#fff9f7]/90 via-[#fff5ef]/86 to-[#fff8f4]/92 backdrop-blur-[2px]">
      <Transition name="cover">
        <section
          v-if="guest && !isOpened"
          class="cover-panel flex min-h-screen flex-col items-center justify-center px-6 text-center"
        >
          <p class="text-xs uppercase tracking-[0.35em] text-[#b97878]">Wedding Invitation</p>

          <h1 class="mt-6 font-serif text-4xl text-[#8f4f4f] drop-shadow-sm">
            {{ weddingInfo.groomName }}
            <span class="block text-2xl">&</span>
            {{ weddingInfo.brideName }}
          </h1>

          <p class="mt-8 text-sm text-[#7b6666]">Trân trọng kính mời</p>

          <h2 class="mt-2 text-2xl font-semibold text-[#5b4040]">
            {{ guest.name }}
          </h2>

          <button
            class="mt-10 rounded-full bg-gradient-to-r from-[#a86565] to-[#934f4f] px-9 py-3 text-sm font-medium text-white shadow-[0_16px_36px_-16px_rgba(143,79,79,0.9)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-14px_rgba(143,79,79,0.95)] active:scale-95"
            type="button"
            @click="openInvitation"
          >
            Mở thiệp
          </button>
        </section>
      </Transition>

      <Transition name="content">
        <section v-if="guest && isOpened" class="mx-auto min-h-screen max-w-[440px] px-5 py-8">
          <div class="invitation-shell rounded-[2rem] px-5 py-8 text-center">
            <RevealOnScroll as="section">
              <p class="text-xs uppercase tracking-[0.3em] text-[#b97878]">Save the date</p>

              <h1 class="mt-5 font-serif text-4xl leading-tight text-[#8f4f4f]">
                {{ weddingInfo.groomName }}
                <span class="block text-2xl">&</span>
                {{ weddingInfo.brideName }}
              </h1>
            </RevealOnScroll>

            <RevealOnScroll as="section" :delay="80">
              <div ref="galleryRef" class="mt-6 overflow-hidden rounded-[1.5rem] border border-[#fff5f0] shadow-lg">
                <div v-if="!showGallery" class="h-60 animate-pulse rounded-[1.5rem] bg-[#f2dfd8]" />

                <Swiper
                  v-else
                  :autoplay="{ delay: 2500, disableOnInteraction: false }"
                  :loop="true"
                  :modules="swiperModules"
                  :pagination="true"
                  class="w-full"
                >
                  <SwiperSlide v-for="image in weddingInfo.galleryImages" :key="image">
                    <img
                      :src="image"
                      alt="Ảnh cưới"
                      class="h-60 w-full object-cover"
                      loading="lazy"
                    />
                  </SwiperSlide>
                </Swiper>
              </div>
            </RevealOnScroll>

            <RevealOnScroll as="section" :delay="120">
              <div class="my-8 h-px bg-[#ead6d0]" />

              <p class="text-sm text-[#7b6666]">Trân trọng kính mời</p>

              <h2 class="mt-2 text-2xl font-semibold text-[#5b4040]">
                {{ guest.name }}
              </h2>

              <p class="mt-6 text-sm leading-6 text-[#7b6666]">
                Đến dự buổi tiệc chung vui cùng gia đình chúng tôi
              </p>
            </RevealOnScroll>

            <RevealOnScroll as="section" :delay="150" class="mt-8 rounded-3xl bg-[#fff8f5] p-5 shadow-sm ring-1 ring-[#f5dfd8]">
              <p class="text-xs uppercase tracking-[0.25em] text-[#b97878]">Thời gian</p>

              <p class="mt-2 text-lg font-semibold text-[#6b4d4d]">
                {{ weddingInfo.weddingDate }}
              </p>

              <p class="mt-2 text-sm leading-6 text-[#7b6666]">
                {{ weddingInfo.venue.note }}
              </p>
            </RevealOnScroll>

            <RevealOnScroll as="section" :delay="180" class="mt-8 text-left">
              <p class="text-center text-xs uppercase tracking-[0.25em] text-[#b97878]">
                Lịch trình
              </p>

              <div class="mt-5 space-y-4">
                <div
                  v-for="(item, index) in weddingInfo.timeline"
                  :key="`${item.time}-${item.title}`"
                  class="timeline-card relative rounded-3xl p-5 pl-7"
                  :style="{ transitionDelay: `${index * 100}ms` }"
                >
                  <div class="absolute left-3 top-6 h-3 w-3 rounded-full bg-[#9f5f5f]" />

                  <p class="text-sm font-semibold text-[#9f5f5f]">
                    {{ item.time }}
                  </p>

                  <h3 class="mt-2 text-base font-semibold">
                    {{ item.title }}
                  </h3>

                  <p class="mt-1 text-sm leading-6 text-[#7b6666]">
                    {{ item.description }}
                  </p>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll as="section" :delay="220" class="mt-8">
              <p class="text-xs uppercase tracking-[0.25em] text-[#b97878]">Thông tin gia đình</p>

              <div class="mt-4 grid grid-cols-2 gap-2 rounded-full bg-[#fff7f3] p-1 ring-1 ring-[#f3ddd5]">
                <button
                  class="rounded-full px-4 py-2 text-sm font-medium transition"
                  :class="
                    activeFamilySide === 'groom'
                      ? 'bg-[#9f5f5f] text-white shadow'
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
                      ? 'bg-[#9f5f5f] text-white shadow'
                      : 'text-[#7b6666]'
                  "
                  type="button"
                  @click="selectFamilySide('bride')"
                >
                  Nhà gái
                </button>
              </div>

              <Transition name="family" mode="out-in">
                <div
                  :key="activeFamilySide"
                  class="mt-4 rounded-3xl bg-[#fff8f5] p-5 text-left shadow-sm ring-1 ring-[#f5dfd8]"
                >
                  <p class="text-sm font-semibold">
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
                      class="flex-1 rounded-full bg-white px-4 py-2 text-center text-sm font-medium text-[#9f5f5f] shadow-sm transition hover:bg-[#fff3ed]"
                    >
                      Gọi
                    </a>

                    <a
                      :href="activeFamily.googleMapUrl"
                      class="flex-1 rounded-full bg-[#9f5f5f] px-4 py-2 text-center text-sm font-medium text-white shadow transition hover:bg-[#8f4f4f]"
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
          <h1 class="text-xl font-semibold">Không tìm thấy thiệp mời</h1>

          <p class="mt-2 text-sm text-[#7b6666]">Link thiệp mời không đúng hoặc chưa được tạo.</p>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.cover-panel {
  animation: floatingIn 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}

.invitation-shell {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 248, 244, 0.96) 100%);
  box-shadow:
    0 30px 80px -45px rgba(72, 33, 33, 0.8),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(255, 232, 224, 0.95);
}

.timeline-card {
  background: #fff8f5;
  box-shadow: 0 12px 24px -22px rgba(104, 58, 58, 0.9);
  border: 1px solid #f7e4dd;
}

.cover-enter-active,
.cover-leave-active {
  transition:
    opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.cover-enter-from,
.cover-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.985);
}

.content-enter-active {
  transition:
    opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.content-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.985);
}

.family-enter-active,
.family-leave-active {
  transition:
    opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.family-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.family-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes floatingIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cover-panel,
  .timeline-card,
  .invitation-shell {
    animation: none !important;
    transition: none !important;
  }
}
</style>
