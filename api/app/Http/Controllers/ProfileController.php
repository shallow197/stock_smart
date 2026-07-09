<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    /** F-AUTH-04 / F-PAR-01 — Profil du commerçant et de la boutique. */
    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'phone' => ['sometimes', 'string', 'max:30', Rule::unique('users', 'phone')->ignore($user->id)],
            'email' => ['sometimes', 'email', 'max:150', Rule::unique('users', 'email')->ignore($user->id)],
            'shop_name' => ['sometimes', 'string', 'max:120'],
            'shop_address' => ['sometimes', 'nullable', 'string', 'max:191'],
        ]);

        $user->update($data);

        return response()->json(['user' => $user]);
    }

    /** F-PAR-02 — Préférences générales. */
    public function updatePreferences(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'currency' => ['sometimes', 'string', 'max:8'],
            'locale' => ['sometimes', 'string', 'max:8'],
            'timezone' => ['sometimes', 'string', 'max:40'],
            'date_format' => ['sometimes', 'string', 'max:20'],
        ]);

        $user->update($data);

        return response()->json(['user' => $user]);
    }

    /** F-AUTH-05 — Changement de mot de passe. */
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        if (! Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'Mot de passe actuel incorrect.', 'errors' => ['current_password' => ['Mot de passe actuel incorrect.']]], 422);
        }

        $user->update(['password' => $data['password']]);

        return response()->json(['message' => 'Mot de passe mis à jour.']);
    }

    public function updateLogo(Request $request)
    {
        $request->validate(['logo' => ['required', 'image', 'max:4096']]);
        $user = $request->user();

        if ($user->logo_path) {
            Storage::disk('public')->delete($user->logo_path);
        }
        $path = $request->file('logo')->store('logos', 'public');
        $user->update(['logo_path' => $path]);

        return response()->json(['user' => $user, 'logo_url' => Storage::disk('public')->url($path)]);
    }
}
