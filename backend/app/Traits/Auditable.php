<?php

namespace App\Traits;

use App\Models\Historique;
use Illuminate\Http\Request;

trait Auditable
{
    protected function logAction(
        string $action,
        ?string $type = null,
        ?string $details = null,
        ?int $documentId = null,
        Request|int|null $requestOrUserId = null
    ): void {
        $userId = null;

        if ($requestOrUserId instanceof Request) {
            $userId = $requestOrUserId->user()?->id;
        } elseif (is_int($requestOrUserId)) {
            $userId = $requestOrUserId;
        } else {
            $requestOrUserId ??= request();
            $userId = $requestOrUserId->user()?->id;
        }

        Historique::create([
            'action' => $action,
            'type' => $type ?? 'document',
            'details' => $details ?? '',
            'date_action' => now(),
            'id_utilisateur' => $userId,
            'id_document' => $documentId,
        ]);
    }
}
