<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$users = User::all();
foreach ($users as $u) {
    $errors = [];
    
    try {
        $test = $u->last_login_at ? (is_string($u->last_login_at) ? $u->last_login_at : $u->last_login_at->toIso8601String()) : null;
    } catch (\Throwable $e) {
        $errors[] = 'last_login_at: ' . $e->getMessage();
    }

    try {
        $test = $u->carte ? 'exists' : '';
    } catch (\Throwable $e) {
        $errors[] = 'carte: ' . $e->getMessage();
    }

    try {
        $test = $u->initials ?? strtoupper(substr($u->name, 0, 2));
    } catch (\Throwable $e) {
        $errors[] = 'initials: ' . $e->getMessage();
    }

    try {
        $test = $u->rights ?? [];
    } catch (\Throwable $e) {
        $errors[] = 'rights: ' . $e->getMessage();
    }

    if ($errors) {
        echo "ERRORS for {$u->id} {$u->email}:\n";
        foreach ($errors as $e) echo "  - $e\n";
    } else {
        echo "OK: {$u->id} {$u->email} {$u->name} {$u->prenom}\n";
    }
}

echo "\nAll done.\n";
