<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$u = App\Models\User::withTrashed()->whereNotNull('carte')->first();
echo $u ? $u->carte . "\n" : 'no user with carte' . "\n";
