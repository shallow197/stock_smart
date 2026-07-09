<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    /** F-PROD-09 — Liste des catégories (avec nombre de produits). */
    public function index(Request $request)
    {
        $categories = $request->user()->categories()
            ->withCount(['products' => fn ($q) => $q->where('is_archived', false)])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80',
                Rule::unique('categories', 'name')->where('user_id', $request->user()->id)],
        ]);

        $category = $request->user()->categories()->create($data);

        return response()->json(['data' => $category], 201);
    }

    public function update(Request $request, int $id)
    {
        $category = $request->user()->categories()->findOrFail($id);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80',
                Rule::unique('categories', 'name')->where('user_id', $request->user()->id)->ignore($category->id)],
        ]);
        $category->update($data);

        return response()->json(['data' => $category]);
    }

    public function destroy(Request $request, int $id)
    {
        $category = $request->user()->categories()->findOrFail($id);
        $category->delete(); // Les produits liés passent category_id à null (nullOnDelete).

        return response()->json(['message' => 'Catégorie supprimée.']);
    }
}
