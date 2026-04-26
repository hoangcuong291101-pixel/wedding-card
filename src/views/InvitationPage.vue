<script setup lang="ts">
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

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
const { elRef: timelineRef, isVisible: showTimeline } = useLazyLoad()

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
    class="min-h-screen bg-cover bg-center text-[#3b2f2f]"
    :style="{ backgroundImage: `url(${weddingInfo.backgroundImage})` }"
  >
    <div class="min-h-screen bg-[#fff7f3]/85 backdrop-blur-[1px]">
      <Transition name="cover">
        <section
          v-if="guest && !isOpened"
          class="flex min-h-screen flex-col items-center justify-center px-6 text-center"
        >
          <p class="text-xs uppercase tracking-[0.35em] text-[#b97878]">Wedding Invitation</p>

          <h1 class="mt-6 font-serif text-4xl text-[#8f4f4f]">
            {{ weddingInfo.groomName }}
            <span class="block text-2xl">&</span>
            {{ weddingInfo.brideName }}
          </h1>

          <p class="mt-8 text-sm text-[#7b6666]">Trân trọng kính mời</p>

          <h2 class="mt-2 text-2xl font-semibold">
            {{ guest.name }}
          </h2>

          <button
            class="mt-10 rounded-full bg-[#9f5f5f] px-8 py-3 text-sm font-medium text-white shadow-lg transition active:scale-95"
            type="button"
            @click="openInvitation"
          >
            Mở thiệp
          </button>
        </section>
      </Transition>

      <Transition name="content">
        <section v-if="guest && isOpened" class="mx-auto min-h-screen max-w-[430px] px-5 py-8">
          <div class="rounded-[2rem] bg-white px-5 py-8 text-center shadow-xl">
            <p class="text-xs uppercase tracking-[0.3em] text-[#b97878]">Save the date</p>

            <h1 class="mt-5 font-serif text-4xl leading-tight text-[#8f4f4f]">
              {{ weddingInfo.groomName }}
              <span class="block text-2xl">&</span>
              {{ weddingInfo.brideName }}
            </h1>

            <div ref="galleryRef" class="mt-6 overflow-hidden rounded-[1.5rem]">
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

            <div class="my-8 h-px bg-[#ead6d0]" />

            <p class="text-sm text-[#7b6666]">Trân trọng kính mời</p>

            <h2 class="mt-2 text-2xl font-semibold">
              {{ guest.name }}
            </h2>

            <p class="mt-6 text-sm leading-6 text-[#7b6666]">
              Đến dự buổi tiệc chung vui cùng gia đình chúng tôi
            </p>

            <div class="mt-8 rounded-3xl bg-[#fff7f3] p-5">
              <p class="text-xs uppercase tracking-[0.25em] text-[#b97878]">Thời gian</p>

              <p class="mt-2 text-lg font-semibold">
                {{ weddingInfo.weddingDate }}
              </p>

              <p class="mt-2 text-sm leading-6 text-[#7b6666]">
                {{ weddingInfo.venue.note }}
              </p>
            </div>

            <div ref="timelineRef" class="mt-8 text-left">
              <p class="text-center text-xs uppercase tracking-[0.25em] text-[#b97878]">
                Lịch trình
              </p>

              <div v-if="!showTimeline" class="mt-5 space-y-3">
                <div class="h-20 animate-pulse rounded-2xl bg-[#f2dfd8]" />
                <div class="h-20 animate-pulse rounded-2xl bg-[#f2dfd8]" />
                <div class="h-20 animate-pulse rounded-2xl bg-[#f2dfd8]" />
              </div>

              <div v-else class="mt-5 space-y-4 animate-fade-in">
                <div
                  v-for="item in weddingInfo.timeline"
                  :key="`${item.time}-${item.title}`"
                  class="relative rounded-3xl bg-[#fff7f3] p-5 pl-7"
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
            </div>

            <div class="mt-8">
              <p class="text-xs uppercase tracking-[0.25em] text-[#b97878]">Thông tin gia đình</p>

              <div class="mt-4 grid grid-cols-2 gap-2 rounded-full bg-[#fff7f3] p-1">
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
                <div :key="activeFamilySide" class="mt-4 rounded-3xl bg-[#fff7f3] p-5 text-left">
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
                      class="flex-1 rounded-full bg-white px-4 py-2 text-center text-sm font-medium text-[#9f5f5f] shadow"
                    >
                      Gọi
                    </a>

                    <a
                      :href="activeFamily.googleMapUrl"
                      class="flex-1 rounded-full bg-[#9f5f5f] px-4 py-2 text-center text-sm font-medium text-white shadow"
                      target="_blank"
                    >
                      Bản đồ
                    </a>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </section>
      </Transition>

      <section v-if="!guest" class="flex min-h-screen items-center justify-center px-6 text-center">
        <div class="rounded-3xl bg-white p-6 shadow-lg">
          <h1 class="text-xl font-semibold">Không tìm thấy thiệp mời</h1>

          <p class="mt-2 text-sm text-[#7b6666]">Link thiệp mời không đúng hoặc chưa được tạo.</p>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.cover-enter-active,
.cover-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

.cover-enter-from,
.cover-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.content-enter-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}

.content-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.family-enter-active,
.family-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.family-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.family-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.4s ease;
}
</style>
