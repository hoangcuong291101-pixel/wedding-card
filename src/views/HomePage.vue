<script setup lang="ts">
import { computed, ref } from 'vue'

import type { Guest, GuestSide } from '@/types/invitation'
import { useGuests } from '@/composables/useGuests'

const { guests, upsertGuest, updateGuest, removeGuest } = useGuests()

const form = ref({
  slug: '',
  name: '',
  side: 'groom' as GuestSide,
})

const editingSlug = ref<string | null>(null)
const copiedSlug = ref<string | null>(null)

const inviteBase = computed(() => `${window.location.origin}/invite`)

function resetForm() {
  form.value = {
    slug: '',
    name: '',
    side: 'groom',
  }
  editingSlug.value = null
}

function submitGuest() {
  if (!form.value.name.trim()) return

  if (editingSlug.value) {
    updateGuest(editingSlug.value, {
      name: form.value.name,
      side: form.value.side,
      nextSlug: form.value.slug,
    })
  } else {
    upsertGuest({
      name: form.value.name,
      slug: form.value.slug,
      side: form.value.side,
    })
  }

  resetForm()
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
    <section class="mx-auto w-full max-w-4xl rounded-3xl bg-white p-6 shadow-lg ring-1 ring-[#eddcc8] md:p-8">
      <header class="mb-6 border-b border-[#efe2d4] pb-4">
        <h1 class="font-serif text-3xl font-semibold">Quản lý khách mời</h1>
        <p class="mt-2 text-sm text-[#6f5a54]">Thêm / sửa / xóa khách mời và phân loại theo nhà trai hoặc nhà gái.</p>
      </header>

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
