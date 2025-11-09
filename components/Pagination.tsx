import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pageNumbers: (number | string)[] = [];
    const pageRange = 2; // How many pages to show around the current page
    const startPage = Math.max(1, currentPage - pageRange);
    const endPage = Math.min(totalPages, currentPage + pageRange);

    if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) {
            pageNumbers.push('...');
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pageNumbers.push('...');
        }
        pageNumbers.push(totalPages);
    }
    
    return (
        <nav className="mt-12 flex justify-center items-center" aria-label="Pagination">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-l-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Previous
            </button>
            {pageNumbers.map((page, index) =>
                typeof page === 'number' ? (
                    <button
                        key={index}
                        onClick={() => onPageChange(page)}
                        aria-current={currentPage === page ? 'page' : undefined}
                        className={`relative -ml-px inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium ${
                            currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={index} className="relative -ml-px inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">
                        {page}
                    </span>
                )
            )}
             <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative -ml-px inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-r-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next
            </button>
        </nav>
    );
};

export default Pagination;
