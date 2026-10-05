<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;

class AssignUserRole extends Command
{
    protected $signature = 'admin:role
        {phone : Verified user phone number}
        {role : Role slug}
        {action=assign : assign or revoke}';

    protected $description = 'اختصاص یا لغو نقش پنل مدیریت برای کاربر تأییدشده';

    public function handle(): int
    {
        $user = User::query()->where('phone', $this->argument('phone'))->first();
        $role = Role::query()
            ->where('name', $this->argument('role'))
            ->where('guard_name', 'web')
            ->where('is_active', true)
            ->first();
        $action = strtolower((string) $this->argument('action'));

        if (!$user) {
            $this->error('کاربر پیدا نشد.');
            return self::FAILURE;
        }
        if (!$role) {
            $this->error('نقش پیدا نشد. ابتدا بذر نقش‌ها را اجرا کنید.');
            return self::FAILURE;
        }
        if (!in_array($action, ['assign', 'revoke'], true)) {
            $this->error('عملیات باید assign یا revoke باشد.');
            return self::FAILURE;
        }

        if ($action === 'assign') {
            $user->assignRole($role);
            $this->info("نقش {$role->label} برای {$user->phone} اختصاص یافت.");
        } else {
            $user->removeRole($role);
            $this->info("نقش {$role->label} از {$user->phone} لغو شد.");
        }

        return self::SUCCESS;
    }
}
