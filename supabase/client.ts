// Mock Supabase client that uses localStorage instead
// This bypasses the need for a real Supabase backend

interface Asset {
  id: string;
  user_id: string;
  category: string;
  status: string;
  condition: string;
  created_at: string;
  asset_name: string;
  manufacturer: string;
  model_number: string;
  purchase_cost?: number | null;
  current_value?: number | null;
}

interface User {
  id: string;
  email: string;
}

// Mock user session
const MOCK_USER: User = {
  id: 'b79130a6-125e-4ec7-964e-3486238597e2',
  email: 'demo@example.com'
};

class MockSupabaseClient {
  auth = {
    getSession: async () => ({
      data: { session: { user: MOCK_USER } },
      error: null
    }),
    signOut: async () => {
      localStorage.removeItem('mock_assets');
      return { error: null };
    },
    onAuthStateChange: (callback: any) => {
      // Immediately call with mock session
      setTimeout(() => {
        callback('SIGNED_IN', { user: MOCK_USER });
      }, 0);
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  };

  from(table: string) {
    return {
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          returns: () => this._query(table, { column, value }),
          single: async () => {
            const result = await this._query(table, { column, value });
            return {
              data: result.data?.[0] || null,
              error: result.error
            };
          }
        }),
        // For queries without .eq()
        then: (resolve: any) => {
          this._query(table, {}).then(resolve);
        }
      }),
      insert: (data: any) => ({
        select: () => ({
          single: async () => {
            const assets = this._getAssets();
            const newAsset = {
              id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
              user_id: MOCK_USER.id,
              asset_name: data.asset_name || 'Unknown',
              manufacturer: data.manufacturer || 'Unknown',
              model_number: data.model_number || 'Unknown',
              category: data.category || 'Other',
              status: data.status || 'in_use',
              condition: data.condition || 'good',
              purchase_cost: data.purchase_cost || null,
              current_value: data.current_value || null
            };
            assets.push(newAsset);
            this._saveAssets(assets);
            return { data: newAsset, error: null };
          }
        }),
        then: async (resolve: any) => {
          const assets = this._getAssets();
          const newAsset = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            user_id: MOCK_USER.id,
            asset_name: data.asset_name || 'Unknown',
            manufacturer: data.manufacturer || 'Unknown',
            model_number: data.model_number || 'Unknown',
            category: data.category || 'Other',
            status: data.status || 'in_use',
            condition: data.condition || 'good',
            purchase_cost: data.purchase_cost || null,
            current_value: data.current_value || null
          };
          assets.push(newAsset);
          this._saveAssets(assets);
          resolve({ data: newAsset, error: null });
        }
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: async () => {
              const assets = this._getAssets();
              const index = assets.findIndex((a: Asset) => a[column as keyof Asset] === value);
              if (index !== -1) {
                assets[index] = { ...assets[index], ...data };
                this._saveAssets(assets);
                return { data: assets[index], error: null };
              }
              return { data: null, error: { message: 'Not found' } };
            }
          })
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          then: async (resolve: any) => {
            const assets = this._getAssets();
            const filtered = assets.filter((a: Asset) => a[column as keyof Asset] !== value);
            this._saveAssets(filtered);
            resolve({ error: null });
          }
        })
      })
    };
  }

  private _getAssets(): Asset[] {
    try {
      const stored = localStorage.getItem('mock_assets');
      return stored ? JSON.parse(stored) : this._getSampleAssets();
    } catch {
      return this._getSampleAssets();
    }
  }

  private _saveAssets(assets: Asset[]) {
    localStorage.setItem('mock_assets', JSON.stringify(assets));
  }

  private async _query(table: string, filter: any) {
    if (table === 'assets') {
      const assets = this._getAssets();
      const filtered = filter.column 
        ? assets.filter((a: Asset) => a[filter.column as keyof Asset] === filter.value)
        : assets;
      return { data: filtered, error: null };
    }
    return { data: [], error: null };
  }

  private _getSampleAssets(): Asset[] {
    // Return sample data if no assets exist
    return [
      {
        id: '1',
        user_id: MOCK_USER.id,
        category: 'Electronics',
        status: 'in_use',
        condition: 'excellent',
        asset_name: 'MacBook Pro 16"',
        manufacturer: 'Apple',
        model_number: 'A2485',
        purchase_cost: 18000,
        current_value: 15000,
        created_at: '2024-01-15T00:00:00Z'
      },
      {
        id: '2',
        user_id: MOCK_USER.id,
        category: 'Furniture',
        status: 'in_use',
        condition: 'good',
        asset_name: 'Herman Miller Chair',
        manufacturer: 'Herman Miller',
        model_number: 'Aeron',
        purchase_cost: 1200,
        current_value: 800,
        created_at: '2024-02-20T00:00:00Z'
      },
      {
        id: '3',
        user_id: MOCK_USER.id,
        category: 'Electronics',
        status: 'in_use',
        condition: 'excellent',
        asset_name: 'iPhone 15 Pro',
        manufacturer: 'Apple',
        model_number: 'A3108',
        purchase_cost: 5500,
        current_value: 5000,
        created_at: '2024-03-10T00:00:00Z'
      }
    ];
  }
}

// Export mock client
export const supabase = new MockSupabaseClient();