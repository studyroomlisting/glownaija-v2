'use client'
import ActionForm from '@/components/dashboard/ActionForm'
import ProductPhotoUpload from '@/components/admin/ProductPhotoUpload'
import { saveProduct } from '@/lib/actions/products'
import type { Product } from '@/types/database'

const CATEGORIES = ['Hair Care', 'Skincare', 'Nail', 'Makeup', 'Tools', 'Accessories']
const BADGE_TYPES = ['rose', 'gold', 'green']

export default function ProductForm({ product, onDone }: { product?: Product | null; onDone?: () => void }) {
  return (
    <ActionForm
      action={saveProduct}
      successMessage={product ? 'Product updated!' : 'Product added!'}
      submitLabel={product ? 'Save Changes →' : 'Add Product →'}
      resetOnSuccess={!product}
      className="space-y-4"
    >
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Product Name *</label>
          <input name="name" className="input" defaultValue={product?.name || ''} required minLength={2} maxLength={150} />
        </div>
        <div>
          <label className="label">Brand *</label>
          <input name="brand" className="input" defaultValue={product?.brand || ''} required maxLength={80} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category *</label>
          <select name="category" className="input" defaultValue={product?.category || CATEGORIES[0]}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Stock Count</label>
          <input name="stock_count" type="number" min="0" className="input" defaultValue={product?.stock_count ?? 0} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Price (£) *</label>
          <input name="price" type="number" min="0.01" step="0.01" className="input" required
            defaultValue={product ? (product.price / 100).toFixed(2) : ''} placeholder="e.g. 12.99" />
        </div>
        <div>
          <label className="label">Original Price (£) <span className="font-normal text-ink-3">(optional, for a discount strike-through)</span></label>
          <input name="original_price" type="number" min="0.01" step="0.01" className="input"
            defaultValue={product?.original_price ? (product.original_price / 100).toFixed(2) : ''} placeholder="e.g. 16.99" />
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea name="description" className="input" rows={3} defaultValue={product?.description || ''} maxLength={1000} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Ingredients</label>
          <textarea name="ingredients" className="input" rows={2} defaultValue={product?.ingredients || ''} maxLength={1000} />
        </div>
        <div>
          <label className="label">How to Use</label>
          <textarea name="how_to_use" className="input" rows={2} defaultValue={product?.how_to_use || ''} maxLength={1000} />
        </div>
      </div>

      <ProductPhotoUpload initialImages={product?.images || []} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Badge Text <span className="font-normal text-ink-3">(optional)</span></label>
          <input name="badge" className="input" defaultValue={product?.badge || ''} placeholder="e.g. New, Bestseller" maxLength={20} />
        </div>
        <div>
          <label className="label">Badge Colour</label>
          <select name="badge_type" className="input" defaultValue={product?.badge_type || 'rose'}>
            {BADGE_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Tags <span className="font-normal text-ink-3">(comma separated)</span></label>
        <input name="tags" className="input" defaultValue={product?.tags?.join(', ') || ''} placeholder="e.g. leave-in, curly hair, vegan" />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input name="is_active" type="checkbox" value="true" defaultChecked={product?.is_active ?? true} className="w-4 h-4 accent-rose" />
        <span className="text-sm font-semibold">Visible in shop</span>
      </label>
    </ActionForm>
  )
}
