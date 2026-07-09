<?php

namespace App\Http\Controllers;

use App\Services\AlertService;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    public function __construct(private AlertService $alerts) {}

    /** F-ALERT-03 — Centre de notifications (Toutes / Stock / Crédits). */
    public function index(Request $request)
    {
        $alerts = $this->alerts->forUser($request->user());

        return response()->json([
            'data' => $alerts,
            'counts' => [
                'all' => $alerts->count(),
                'stock' => $alerts->where('category', 'stock')->count(),
                'credit' => $alerts->where('category', 'credit')->count(),
            ],
            'unread' => $this->alerts->unreadCount($request->user()),
        ]);
    }

    public function unreadCount(Request $request)
    {
        return response()->json(['unread' => $this->alerts->unreadCount($request->user())]);
    }

    /** « Tout marquer lu ». */
    public function markSeen(Request $request)
    {
        $request->user()->update(['alerts_seen_at' => now()]);

        return response()->json(['unread' => 0]);
    }
}
