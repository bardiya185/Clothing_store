<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;

class PromoteUserToAdmin extends Command
{
    protected $signature = 'admin:promote {phone : The verified user phone number} {--role=super_admin : Permission collection slug}';
    protected $description = 'اختصاص دسترسی پنل مدیریت به کاربر تأییدشده';

    public function handle(): int
    {
        $roleName = (string) $this->option('role');
        $user = User::query()->where('phone', $this->argument('phone'))->first();
        $role = Role::query()->where('name', $roleName)->where('guard_name', 'web')->where('is_active', true)->first();

        if (!$user) {
            $this->error('کاربر پیدا نشد. ابتدا ورود با کد یک‌بارمصرف را تکمیل کنید.');
            return self::FAILURE;
        }
        if (!$role) {
            $this->error("نقش [{$roleName}] پیدا نشد. ابتدا بذر نقش‌ها را اجرا کنید.");
            return self::FAILURE;
        }

        $user->syncRoles([$role]);
        $user->forceFill(['role' => $roleName === 'super_admin' ? 'admin' : 'manager'])->save();
        $this->info("دسترسی {$role->label} برای {$user->phone} فعال شد.");
        return self::SUCCESS;
    }
}
