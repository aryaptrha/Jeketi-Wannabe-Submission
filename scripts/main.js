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
      title: 'Welcome!',
      text: 'Please enter something:',
      input: 'text',
      inputPlaceholder: 'Enter something',
      showCancelButton: true,
      confirmButtonText: 'Confirm'
    }).then((result) => {
      if (result.isConfirmed) {
        sessionStorage.setItem('inputValue', result.value);
        Swal.fire('Welcome Back!', `You entered: ${result.value}`, 'success');
      }
    });
  } else {
    Swal.fire('Welcome Back!', `You entered: ${sessionStorage.getItem('inputValue')}`, 'success');
  }
  