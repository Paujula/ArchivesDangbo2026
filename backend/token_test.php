<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
$user = App\Models\User::where('role', 'chef')->first();
echo $user->email . "\n";
echo $user->createToken('test')->plainTextToken . "\n";
