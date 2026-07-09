<?php

namespace App\Http\Controllers;

use App\Services\JournalService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class JournalController extends Controller
{
    public function __construct(private JournalService $journal) {}

    /** F-RAP-01 / F-RAP-02 — Journal horodaté + rapport d'une journée. */
    public function index(Request $request)
    {
        $request->validate(['date' => ['nullable', 'date']]);
        $date = $request->filled('date') ? Carbon::parse($request->string('date')->value()) : now();
        $user = $request->user();

        return response()->json([
            'date' => $date->toDateString(),
            'activities' => $this->journal->forDate($user, $date),
            'report' => $this->journal->dailyReport($user, $date),
        ]);
    }
}
