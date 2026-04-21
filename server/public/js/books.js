// Books JS
document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('book-search-btn');
    const searchInput = document.getElementById('book-search-input');
    const availabilityFilter = document.getElementById('availability-filter');

    fetchBooks();

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            fetchBooks(searchInput.value, availabilityFilter.value);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                fetchBooks(searchInput.value, availabilityFilter.value);
            }
        });
    }

    if (availabilityFilter) {
        availabilityFilter.addEventListener('change', () => {
            fetchBooks(searchInput.value, availabilityFilter.value);
        });
    }
});

async function fetchBooks(query = '', availability = 'all') {
    const container = document.getElementById('books-container');
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;

    try {
        const params = new URLSearchParams();
        if (query && query.trim() !== '') {
            params.append('title', query.trim());
        }
        if (availability && availability !== 'all') {
            params.append('available', availability);
        }

        const url = `/api/books/search?${params.toString()}`;
        const books = await apiRequest(url);
        if (!books || books.length === 0) {
            container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted fs-4">No books found matching your criteria.</p></div>';
            return;
        }

        container.innerHTML = '';
        books.forEach(book => {
            const card = createBookCard(book);
            container.appendChild(card);
        });
    } catch (err) {
        showAlert(err.message);
        container.innerHTML = '<div class="col-12 text-center py-5 text-danger"><i class="fas fa-exclamation-circle fs-1 mb-2"></i><p>Failed to load books.</p></div>';
    }
}

function createBookCard(book) {
    const div = document.createElement('div');
    div.className = 'col-md-4 col-lg-3';
    
    const badgeColor = book.availableCopies > 0 ? 'bg-success' : 'bg-danger';
    const badgeText = book.availableCopies > 0 ? 'Available' : 'Out of Stock';

    div.innerHTML = `
        <div class="card h-100 border-0 shadow-sm rounded-4 book-card overflow-hidden">
            <div class="card-body p-4">
                <div class="d-flex justify-content-between mb-2">
                    <span class="badge ${badgeColor}">${badgeText}</span>
                    <small class="text-muted">${book.isbn}</small>
                </div>
                <h5 class="card-title fw-bold mb-1">${book.title}</h5>
                <p class="card-text text-secondary small mb-3">by ${book.author}</p>
                <div class="mt-auto">
                    <button class="btn btn-outline-primary w-100 rounded-pill" onclick="showBookDetails('${book._id}')">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    `;
    return div;
}

async function showBookDetails(bookId) {
    try {
        // Fetch specific book details by ISBN or just search by ID if controller supported it.
        // Since searchBooks is what we have, we'll use it to find the book.
        // Better: search by ID if we add a getBookById route.
        // For now, let's just find it in the current search results or re-fetch.
        const books = await apiRequest(`/api/books/search?title=`);
        if (!books) return;
        const book = books.find(b => b._id === bookId);
        
        if (!book) return;

        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');
        const modalFooter = document.getElementById('modal-footer');
        
        let user;
        try {
            user = JSON.parse(localStorage.getItem('user'));
        } catch (err) {
            console.error('Error parsing user data:', err);
        }

        modalTitle.textContent = book.title;
        modalContent.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <p class="mb-1"><strong>Author:</strong> ${book.author}</p>
                    <p class="mb-1"><strong>ISBN:</strong> ${book.isbn}</p>
                    <p class="mb-1"><strong>Publisher:</strong> ${book.publisher || 'N/A'}</p>
                    <p class="mb-3"><strong>Copies:</strong> ${book.availableCopies} / ${book.totalCopies}</p>
                    <p class="text-muted">${book.description || 'No description available.'}</p>
                </div>
            </div>
        `;

        modalFooter.innerHTML = '';
        
        if (user && (user.role === 'student' || user.role === 'staff')) {
            const requestBtn = document.createElement('button');
            requestBtn.className = 'btn btn-primary w-100 rounded-pill';
            requestBtn.textContent = 'Request to Borrow';
            requestBtn.onclick = () => requestBook(book._id);
            if (book.availableCopies === 0) {
                requestBtn.disabled = true;
                requestBtn.textContent = 'Out of Stock';
            }
            modalFooter.appendChild(requestBtn);

            const returnBtn = document.createElement('button');
            returnBtn.className = 'btn btn-outline-secondary w-100 rounded-pill mt-2';
            returnBtn.textContent = 'Return Book';
            returnBtn.onclick = () => returnBook(book._id);
            modalFooter.appendChild(returnBtn);
        } else if (user && user.role === 'librarian') {
            modalFooter.innerHTML = '<p class="text-muted small">Librarians can manage status via the Status update API.</p>';
        } else {
            modalFooter.innerHTML = '<p class="text-muted small">Please <a href="/login">login</a> to request books.</p>';
        }

        const modal = new bootstrap.Modal(document.getElementById('bookModal'));
        modal.show();
    } catch (err) {
        showAlert(err.message);
    }
}

async function requestBook(bookId) {
    try {
        await apiRequest(`/api/books/request/${bookId}`, 'POST');
        showAlert('Borrow request submitted! Waiting for admin approval.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('bookModal')).hide();
        fetchBooks();
    } catch (err) {
        showAlert(err.message);
    }
}

async function returnBook(bookId) {
    try {
        await apiRequest(`/api/books/return/${bookId}`, 'POST');
        showAlert('Book returned successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('bookModal')).hide();
        fetchBooks();
    } catch (err) {
        showAlert(err.message);
    }
}
