'use server'

import { prisma } from '@/lib/db'
import data from '@/lib/data'
import { ISettingInput } from '@/types'
import { formatError } from '@/lib/utils'
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache'

export async function getSetting(): Promise<ISettingInput> {
  try {
    // Temporarily disable caching to debug the issue
    const s = await prisma.setting.findFirst()
    if (!s) {
      console.log('No settings found in database, creating default')
      const created = await prisma.setting.create({
        data: {
          common: data.settings[0].common as any,
          site: data.settings[0].site as any,
          carousels: data.settings[0].carousels as any,
          videos: data.settings[0].videos as any || [],
          availableLanguages: data.settings[0].availableLanguages as any,
          defaultLanguage: data.settings[0].defaultLanguage,
          availableCurrencies: data.settings[0].availableCurrencies as any,
          defaultCurrency: data.settings[0].defaultCurrency,
          availablePaymentMethods: data.settings[0].availablePaymentMethods as any,
          defaultPaymentMethod: data.settings[0].defaultPaymentMethod,
          availableDeliveryDates: data.settings[0].availableDeliveryDates as any,
          defaultDeliveryDate: data.settings[0].defaultDeliveryDate,
          chatContent: data.settings[0].chatContent as any || {},
          deliverySettings: data.settings[0].deliverySettings as any || {},
          taxSettings: data.settings[0].taxSettings as any || {},
          productPricing: data.settings[0].productPricing as any || {},
        },
      })
      return JSON.parse(JSON.stringify(created)) as ISettingInput
    }
    console.log('Retrieved setting from database with chatContent:', s.chatContent)
    return JSON.parse(JSON.stringify(s)) as ISettingInput
  } catch (err) {
    console.error('Error in getSetting:', err)
    // Fallback to static data to avoid breaking the app
    return data.settings[0] as ISettingInput
  }
}

export async function updateSetting(newSetting: ISettingInput) {
  try {
    console.log('Updating settings with chatContent:', newSetting.chatContent)
    
    const existing = await prisma.setting.findFirst({ select: { id: true } })

    if (!existing) {
      const created = await prisma.setting.create({
        data: {
          common: newSetting.common as any,
          site: newSetting.site as any,
          carousels: newSetting.carousels as any,
          videos: newSetting.videos as any || [],
          availableLanguages: newSetting.availableLanguages as any,
          defaultLanguage: newSetting.defaultLanguage,
          availableCurrencies: newSetting.availableCurrencies as any,
          defaultCurrency: newSetting.defaultCurrency,
          availablePaymentMethods: newSetting.availablePaymentMethods as any,
          defaultPaymentMethod: newSetting.defaultPaymentMethod,
          availableDeliveryDates: newSetting.availableDeliveryDates as any,
          defaultDeliveryDate: newSetting.defaultDeliveryDate,
          chatContent: newSetting.chatContent as any || {},
          deliverySettings: newSetting.deliverySettings as any || {},
          taxSettings: newSetting.taxSettings as any || {},
          productPricing: newSetting.productPricing as any || {},
        },
      })
      console.log('Created new setting with chatContent:', created.chatContent)
    } else {
      const updated = await prisma.setting.update({
        where: { id: existing.id },
        data: {
          common: newSetting.common as any,
          site: newSetting.site as any,
          carousels: newSetting.carousels as any,
          videos: newSetting.videos as any || [],
          availableLanguages: newSetting.availableLanguages as any,
          defaultLanguage: newSetting.defaultLanguage,
          availableCurrencies: newSetting.availableCurrencies as any,
          defaultCurrency: newSetting.defaultCurrency,
          availablePaymentMethods: newSetting.availablePaymentMethods as any,
          defaultPaymentMethod: newSetting.defaultPaymentMethod,
          availableDeliveryDates: newSetting.availableDeliveryDates as any,
          defaultDeliveryDate: newSetting.defaultDeliveryDate,
          chatContent: newSetting.chatContent as any || {},
          deliverySettings: newSetting.deliverySettings as any || {},
          taxSettings: newSetting.taxSettings as any || {},
          productPricing: newSetting.productPricing as any || {},
        },
      })
      console.log('Updated setting with chatContent:', updated.chatContent)
    }

    revalidatePath('/admin/settings')
    revalidatePath('/')
    revalidateTag('settings')

    return { success: true, message: 'تم حفظ الإعدادات بنجاح' }
  } catch (error) {
    console.error('Error in updateSetting:', error)
    return { success: false, message: formatError(error) }
  }
}
