<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { useGuests } from '@/composables/useGuests'
import { useWedding } from '@/composables/useWedding'
import type { Guest, GuestSide } from '@/types/invitation'

const { guests, upsertGuest, updateGuest, removeGuest } = useGuests()
const { wedding, isLoadingWedding, loadWedding, updateWedding } = useWedding()

const form = ref({
  slug: '',
  name: '',
  side: 'groom' as GuestSide,
  inviteTime: '',
})

const weddingForm = ref({
  groomName: '',
  brideName: '',
  weddingDate: '',
  venueNote: '',
})

const editingSlug = ref<string | null>(null)
const copiedSlug = ref<string | null>(null)
const weddingSaved = ref(false)

const inviteBase = computed(() => `${window.location.origin}/invite`)

onMounted(async () => {
  await loadWedding()
  if (wedding.value) {
    weddingForm.value = {
      groomName: wedding.value.groomName,
      brideName: wedding.value.brideName,
      weddingDate: wedding.value.weddingDate,
      venueNote: wedding.value.venue.note,
    }
  }
})

function resetForm() {
  form.value = {
    slug: '',
    name: '',
    side: 'groom',
    inviteTime: '',
  }
  editingSlug.value = null
}

function submitGuest() {
  if (!form.value.name.trim()) return

  if (editingSlug.value) {
    updateGuest(editingSlug.value, {
      name: form.value.name,
      side: form.value.side,
      inviteTime: form.value.inviteTime,
      nextSlug: form.value.slug,
    })
  } else {
    upsertGuest({
      name: form.value.name,
      slug: form.value.slug,
      side: form.value.side,
      inviteTime: form.value.inviteTime,
    })
  }

  resetForm()
}

async function saveWeddingInfo() {
  if (!wedding.value) return

  await updateWedding({
    groomName: weddingForm.value.groomName.trim(),
    brideName: weddingForm.value.brideName.trim(),
    weddingDate: weddingForm.value.weddingDate.trim(),
    venue: {
      ...wedding.value.venue,
      note: weddingForm.value.venueNote.trim(),
    },
  })

  weddingSaved.value = true
  window.setTimeout(() => {
    weddingSaved.value = false
  }, 1800)
}

function editGuest(guest: Guest) {
  editingSlug.value = guest.slug
  form.value = {
    slug: guest.slug,
    name: guest.name,
    side: guest.side,
    inviteTime: guest.inviteTime,
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
    <section class="mx-auto w-full max-w-5xl space-y-6 rounded-3xl bg-white p-6 shadow-lg ring-1 ring-[#eddcc8] md:p-8">
      <header class="border-b border-[#efe2d4] pb-4">
        <h1 class="font-serif text-3xl font-semibold">Quản lý dữ liệu thiệp cưới</h1>
        <p class="mt-2 text-sm text-[#6f5a54]">Sửa thông tin đám cưới + quản lý khách mời từ một màn hình.</p>
      </header>

      <section class="rounded-2xl bg-[#fffaf5] p-5 ring-1 ring-[#f0dfcf]">
        <h2 class="font-serif text-xl font-semibold">Thông tin đám cưới</h2>

        <p v-if="isLoadingWedding" class="mt-3 text-sm text-[#7f6a64]">Đang tải dữ liệu...</p>

        <form v-else class="mt-4 grid gap-4 md:grid-cols-2" @submit.prevent="saveWeddingInfo">
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
            <span class="mb-1 block text-sm font-medium">Ngày cưới</span>
            <input
              v-model="weddingForm.weddingDate"
              class="w-full rounded-xl border border-[#e4d5c5] bg-white px-3 py-2 outline-none focus:border-[#c99855]"
              required
            />
          </label>

          <label class="block">
            <span class="mb-1 block text-sm font-medium">Ghi chú địa điểm</span>
            <input
              v-model="weddingForm.venueNote"
              class="w-full rounded-xl border border-[#e4d5c5] bg-white px-3 py-2 outline-none focus:border-[#c99855]"
              required
            />
          </label>

          <div class="md:col-span-2 flex items-center gap-3 pt-1">
            <button
              type="submit"
              class="rounded-xl bg-[#c99855] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#bb8844]"
            >
              Lưu thông tin đám cưới
            </button>
            <p v-if="weddingSaved" class="text-sm font-semibold text-[#4f8f5a]">Đã lưu thành công</p>
          </div>
        </form>
      </section>

      <div class="grid gap-7 md:grid-cols-[320px_1fr]">
        <form class="space-y-4 rounded-2xl bg-[#fffaf5] p-5 ring-1 ring-[#f0dfcf]" @submit.prevent="submitGuest">
          <h2 class="font-serif text-xl font-semibold">{{ editingSlug ? 'Chỉnh sửa khách mời' : 'Thêm khách mời' }}</h2>

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
            <span class="mb-1 block text-sm font-medium">Slug (tùy chọn)</span>
            <input
              v-model="form.slug"
              class="w-full rounded-xl border border-[#e4d5c5] bg-white px-3 py-2 outline-none focus:border-[#c99855]"
              placeholder="anh-minh"
            />
          </label>


          <label class="block">
            <span class="mb-1 block text-sm font-medium">Thời gian mời riêng</span>
            <input
              v-model="form.inviteTime"
              class="w-full rounded-xl border border-[#e4d5c5] bg-white px-3 py-2 outline-none focus:border-[#c99855]"
              placeholder="Ví dụ: 17:00 - 09/05/2026"
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

          <div class="space-y-3">
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
                  <p v-if="copiedSlug === guest.slug" class="mt-1 text-xs font-semibold text-[#4f8f5a]">
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

            <p v-if="guests.length === 0" class="rounded-xl bg-white p-4 text-sm text-[#7f6a64]">
              Chưa có khách mời nào.
            </p>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
