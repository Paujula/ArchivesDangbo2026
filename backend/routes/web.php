<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect(env('FRONTEND_URL', 'http://localhost:3001'));
});


