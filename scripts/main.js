'use strict';

const scrollToTopBtn = document.getElementById('scrollToTopBtn');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function scrollBehavior() {
    return reduceMotion.matches ? 'auto' : 'smooth';
}

window.addEventListener('scroll', () => {
    scrollToTopBtn.classList.toggle('is-visible', window.scrollY > 20);
}, { passive: true });

scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    });
});

if (window.Swal) {
    const storedName = sessionStorage.getItem('inputValue');
    if (!storedName) {
        Swal.fire({
            title: 'Halo Wota!!!',
            text: 'Siapa Oshi Kamu?',
            input: 'text',
            inputPlaceholder: 'Nama Oshi Kamu...',
            showCancelButton: true,
            confirmButtonText: 'Confirm'
        }).then((result) => {
            const name = (result.value ?? '').trim();
            if (result.isConfirmed && name) {
                sessionStorage.setItem('inputValue', name);
                Swal.fire('Halo Wota!', `${name} Oshi ku juga!!!`, 'success');
            }
        });
    } else {
        Swal.fire('Lahhh', `You entered: ${storedName}`, 'success');
    }
}
