import { getBalance, getTransactions } from '../utils/credits-db.js';
import { CREDIT_PACKAGES } from '../utils/packages.js';
import { getCurrentUser } from '../utils/auth.js';
// NOTE: credits route is GET-only — no CSRF needed

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = String(user.id);

    return Response.json({
      balance: await getBalance(userId),
      packages: CREDIT_PACKAGES,
      transactions: await getTransactions(userId, 20),
    });
  } catch (error) {
    console.error('Credits GET error:', error.message);
    return Response.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}
