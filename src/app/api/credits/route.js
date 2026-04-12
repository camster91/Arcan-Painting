import { getBalance, getTransactions } from '../utils/credits-db.js';
import { CREDIT_PACKAGES } from '../utils/packages.js';
import { requireAuth } from '../utils/auth.js';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.username;

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
