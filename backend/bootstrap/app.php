<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

$_ENV['COMPOSER_VENDOR_DIR'] = dirname(__DIR__) . '/vendor';

$app = Application::configure(basePath: dirname(__DIR__, 2))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);

        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();

$app->useAppPath($app->basePath('backend/app'));
$app->useBootstrapPath($app->basePath('backend/bootstrap'));
$app->useConfigPath($app->basePath('backend/config'));
$app->useDatabasePath($app->basePath('backend/database'));
$app->useStoragePath($app->basePath('backend/storage'));
$app->usePublicPath($app->basePath('backend/public'));

return $app;
