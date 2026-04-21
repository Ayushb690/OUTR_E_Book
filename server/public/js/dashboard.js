// Dashboard JS
document.addEventListener('DOMContentLoaded', async () => {
    let user;
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            console.warn('No user found in localStorage');
            return;
        }
        user = JSON.parse(userStr);
    } catch (err) {
        console.error('Failed to parse user from localStorage', err);
        return;
    }

    if (!user) return;

    // Fill profile info with defensive checks
    if (document.getElementById('user-name')) {
        document.getElementById('user-name').textContent = user.name || 'User';
    }
    if (document.getElementById('profile-name')) {
        document.getElementById('profile-name').textContent = user.name || 'N/A';
    }
    if (document.getElementById('profile-role') && user.role) {
        document.getElementById('profile-role').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    } else if (document.getElementById('profile-role')) {
        document.getElementById('profile-role').textContent = 'N/A';
    }
    if (document.getElementById('profile-email')) {
        document.getElementById('profile-email').textContent = user.email || 'N/A';
    }
    if (document.getElementById('profile-id')) {
        document.getElementById('profile-id').textContent = user.memberId || 'N/A';
    }

    // Determine content to show based on role
    const userRole = user.role || 'student';

    // Show librarian specific content
    if (userRole === 'librarian') {
        const librarianStats = document.getElementById('librarian-stats');
        if (librarianStats) librarianStats.style.display = 'flex';
        
        document.querySelectorAll('.librarian-action').forEach(el => {
            el.style.display = 'block';
            el.classList.remove('d-none');
        });
        
        // Fetch librarian stats
        try {
            const stockSummary = await apiRequest('/api/reports/stock-summary');
            if (stockSummary && Array.isArray(stockSummary)) {
                const totalStock = stockSummary.reduce((acc, s) => acc + (s.totalStock || 0), 0);
                const statTotalBooks = document.getElementById('stat-total-books');
                if (statTotalBooks) statTotalBooks.textContent = totalStock;
            }
        } catch (err) {
            console.error('Failed to fetch librarian stats', err);
        }
    } else {
        // Show student specific content
        const studentContent = document.getElementById('student-content');
        if (studentContent) studentContent.style.display = 'flex';
        
        // Fetch personal transactions
        try {
            const transactions = await apiRequest('/api/books/my-transactions');
            if (transactions && Array.isArray(transactions)) {
                const activeBody = document.getElementById('active-issues-body');
                const recentBody = document.getElementById('recent-requests-body');
                
                const active = transactions.filter(t => t.status === 'issued' || t.status === 'overdue');
                const requests = transactions.filter(t => t.status === 'requested' || t.status === 'rejected');

                if (active.length > 0 && activeBody) {
                    activeBody.innerHTML = active.map(t => `
                        <tr>
                            <td>
                                <div class="fw-bold">${t.book ? t.book.title : 'Unknown Book'}</div>
                                <small class="text-muted">${t.book ? t.book.isbn : 'N/A'}</small>
                            </td>
                            <td>${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}</td>
                            <td><span class="text-${(t.currentFine || 0) > 0 ? 'danger' : 'success'}">$${t.currentFine || 0}</span></td>
                        </tr>
                    `).join('');
                }

                if (requests.length > 0 && recentBody) {
                    recentBody.innerHTML = requests.map(t => `
                        <tr>
                            <td><div class="fw-bold">${t.book ? t.book.title : 'Unknown Book'}</div></td>
                            <td>
                                <span class="badge bg-${getStatusBadgeColor(t.status)}">${t.status}</span>
                            </td>
                        </tr>
                    `).join('');
                }
            }
        } catch (err) {
            console.error('Failed to fetch user transactions', err);
        }
    }
});

function getStatusBadgeColor(status) {
    switch (status) {
        case 'requested': return 'warning';
        case 'issued': return 'primary';
        case 'returned': return 'success';
        case 'overdue': return 'danger';
        case 'rejected': return 'secondary';
        default: return 'info';
    }
}
