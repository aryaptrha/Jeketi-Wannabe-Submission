var scrollToTopBtn = document.getElementById("scrollToTopBtn");

window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    scrollToTopBtn.style.display = "block";
  } else {
    scrollToTopBtn.style.display = "none";
  }
}

scrollToTopBtn.addEventListener("click", function() {
  scrollToTop();
});

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

if (!sessionStorage.getItem('inputValue')) {
    Swal.fire({
      title: 'Halo Wota!!!',
      text: 'Siapa Oshi Kamu?',
      input: 'text',
      inputPlaceholder: 'Nama Oshi Kamu...',
      showCancelButton: true,
      confirmButtonText: 'Confirm'
    }).then((result) => {
      if (result.isConfirmed) {
        sessionStorage.setItem('inputValue', result.value);
        Swal.fire('Halo Wota! ', `${result.value} Oshi ku juga!!!`, 'success');
      }
    });
  } else {
    Swal.fire('Lahhh', `You entered: ${sessionStorage.getItem('inputValue')}`, 'success');
  }
  