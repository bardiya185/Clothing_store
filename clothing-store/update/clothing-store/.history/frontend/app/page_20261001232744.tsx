// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api'; // حتماً آدرس رو چک کن درست باشه
import Cookies from 'js-cookie';

export default function DebugPage() {
  const [status, setStatus] = useState('در انتظار شروع درخواست...');

  const testRequest = async () => {
    try {
      setStatus('🚀 در حال ارسال درخواست به لاراول...');
      
      // فراخوانی مستقیم API پروفایل
      const response = await api.get('/auth/me');
      
      console.log('✅ پاسخ موفقیت‌آمیز:', response.data);
      setStatus('✅ درخواست با موفقیت انجام شد و اطلاعات دریافت شد.');
    } catch (error: any) {
      console.error('❌ خطا در درخواست:', error);
      setStatus('❌ درخواست با خطا مواجه شد. (کنسول و نتورک رو چک کن)');
    }
  };

  return (
    <div className="p-10 flex flex-col items-center gap-6 dir-rtl">
      <h1 className="text-xl font-bold text-black">صفحه عیب‌یابی ارتباط با لاراول</h1>
      
      <div className="p-4 bg-gray-100 rounded border w-full max-w-md text-center text-black">
        {status}
      </div>

      <div className="flex gap-4">
        <button 
          onClick={testRequest}
          className="px-6 py-2 bg-blue-600 text-white rounded shadow"
        >
          شلیک دستی درخواست به لاراول
        </button>

        <button 
          onClick={() => {
            Cookies.remove('access_token');
            alert('اکسس توکن پاک شد! حالا دکمه شلیک رو بزن.');
          }}
          className="px-6 py-2 bg-red-600 text-white rounded shadow"
        >
          پاک کردن اکسس توکن
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        بعد از کلیک روی دکمه آبی، حتماً تب Network رو نگاه کن.
      </div>
    </div>
  );
}