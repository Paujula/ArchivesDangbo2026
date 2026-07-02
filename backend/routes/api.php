<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\ArchivesController;
use App\Http\Controllers\Api\UsersController;
use App\Http\Controllers\Api\HistoriqueController;
use App\Http\Controllers\Api\DemandesController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/change-password', [AuthController::class, 'changePassword']);

    // Lecture nomenclature — accessible à tous les authentifiés
    Route::get('/settings/directions', [SettingsController::class, 'listDirections']);
    Route::get('/settings/series', [SettingsController::class, 'listSeries']);
    Route::get('/settings/sous-series', [SettingsController::class, 'listSousSeries']);
    Route::get('/settings/services', [SettingsController::class, 'listServices']);

    // Écriture nomenclature — chef/admin uniquement
    Route::middleware('role:chef,admin')->group(function () {
        Route::post('/settings/directions', [SettingsController::class, 'createDirection']);
        Route::put('/settings/directions/{direction}', [SettingsController::class, 'updateDirection']);
        Route::delete('/settings/directions/{direction}', [SettingsController::class, 'deleteDirection']);
        Route::post('/settings/series', [SettingsController::class, 'createSerie']);
        Route::put('/settings/series/{serieArchive}', [SettingsController::class, 'updateSerie']);
        Route::delete('/settings/series/{serieArchive}', [SettingsController::class, 'deleteSerie']);
        Route::post('/settings/sous-series', [SettingsController::class, 'createSousSerie']);
        Route::put('/settings/sous-series/{sousSerie}', [SettingsController::class, 'updateSousSerie']);
        Route::delete('/settings/sous-series/{sousSerie}', [SettingsController::class, 'deleteSousSerie']);
        Route::post('/settings/services', [SettingsController::class, 'createService']);
        Route::put('/settings/services/{service}', [SettingsController::class, 'updateService']);
        Route::delete('/settings/services/{service}', [SettingsController::class, 'deleteService']);
    });

    // Archives — upload/create/edit : chef/admin/archiviste ; delete : chef/admin
    Route::post('/archives/upload', [ArchivesController::class, 'upload'])->middleware('role:chef,admin,archiviste');
    Route::get('/archives', [ArchivesController::class, 'index']);
    Route::post('/archives', [ArchivesController::class, 'store'])->middleware('role:chef,admin,archiviste');
    Route::get('/archives/{document}', [ArchivesController::class, 'show']);
    Route::put('/archives/{document}', [ArchivesController::class, 'update'])->middleware('role:chef,admin,archiviste');
    Route::delete('/archives/{document}', [ArchivesController::class, 'destroy'])->middleware('role:chef,admin');
    Route::post('/archives/{document}/view', [ArchivesController::class, 'recordView']);
    Route::get('/archives/{document}/related', [ArchivesController::class, 'related']);
    Route::get('/archives/{document}/download', [ArchivesController::class, 'download']);

    // Utilisateurs — chef/admin uniquement
    Route::middleware('role:chef,admin')->group(function () {
        Route::get('/users', [UsersController::class, 'index']);
        Route::post('/users', [UsersController::class, 'store']);
        Route::put('/users/{user}', [UsersController::class, 'update']);
        Route::delete('/users/{user}', [UsersController::class, 'deactivate']);
        Route::delete('/users/{user}/force', [UsersController::class, 'destroy']);
        Route::post('/users/{user}/activate', [UsersController::class, 'activate']);
        Route::post('/users/{user}/carte', [UsersController::class, 'uploadCarte']);
    });

    Route::get('/historiques', [HistoriqueController::class, 'index']);
    Route::get('/dashboard/stats', [HistoriqueController::class, 'stats']);

    Route::get('/demandes/stats', [DemandesController::class, 'stats']);
    Route::get('/demandes', [DemandesController::class, 'index']);
    Route::post('/demandes', [DemandesController::class, 'store']);
    Route::get('/demandes/check', [DemandesController::class, 'check']);

    // Approbation/refus demandes — chef/admin uniquement
    Route::middleware('role:chef,admin')->group(function () {
        Route::put('/demandes/{demande}/approve', [DemandesController::class, 'approve']);
        Route::put('/demandes/{demande}/reject', [DemandesController::class, 'reject']);
    });
});
