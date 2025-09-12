import { Metadata } from 'next'
import WebPageForm from '../web-page-form'

export const metadata: Metadata = {
  title: 'إنشاء صفحة ويب',
}

export default function CreateWebPagePage() {
  return (
    <>
      <h1 className='h1-bold'>إنشاء صفحة ويب</h1>

      <div className='my-8'>
        <WebPageForm type='Create' />
      </div>
    </>
  )
}
