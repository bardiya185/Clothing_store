/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useAuth.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, sendOtpToLaravel, VerifyOtpToLaravel } from '../services/auth.service';
import { useRouter } from 'next/navigation';
import { VerifyOtp } from '@/app/Types/auth';
import { toast } from 'sonner';
import Cookies from 'js-cookie'; // 👈 ۱. وارد کردن js-cookie

export const useSendOtp = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (phone: string) => sendOtpToLaravel(phone),

    onSuccess: (data, phone) => {
      toast.success(data.message);
      router.push(`/verify?phone=${encodeURIComponent(phone)}`);
    },

    onError: (error: any) => {
      const message = error.response?.data?.message;
      if(message == undefined)
        toast.error('erron in concting to the server');
      else
      toast.error(message);
    }
  });

};


export const useVerifyOtp = () => {
  const router = useRouter();


  return useMutation({
    mutationFn: ({ phone, code }: VerifyOtp) => VerifyOtpToLaravel(phone, code),


    onSuccess: (data) => {
      const tokens = data?.data?.tokens;

      if (tokens) {
        
          Cookies.set('access_token', tokens.access_token, {
          expires: 15 / (24 * 60), // ۱۵ دقیقه
          sameSite: 'lax',
        });


        Cookies.set('refresh_token', tokens.refresh_token, {
          expires: 30, // ۳۰ روز
          sameSite: 'lax',
        });
      }

      toast.success(data.message);
      router.push('/');
 

    },

    onError: (error: any) => {
      const message = error.response?.data?.message;
      if(message == undefined)
        toast.error('erron in concting to the server');
      else
      toast.error(message);
    }
    
  });

};

export function useLogOut(){
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (access_token: string) => LogOut(access_token),

    onSuccess: (data) => {

    Cookies.remove('refresh_token');
    Cookies.remove('access_token');
    queryClient.clear();
    toast.success(data.message);
    router.push('/');

    },
    onError: (data) => {
      Cookies.remove('refresh_token');
      Cookies.remove('access_token');
      toast.success(data.message);
      router.push('/');
    }
    
  })



}


