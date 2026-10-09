'use strict';

// TreasuryDierct Setup Scripts


// Focus outline hiding for mouse users
(function () {
  window.addEventListener('mousedown', function (event) {
    document.body.setAttribute('data-mouse-active', '');
  });

  window.addEventListener('keydown', function (event) {
    document.body.removeAttribute('data-mouse-active');
  });
})();


// Tooltips

$(function() {
  $('[data-toggle="tooltip"]').tooltip();
});


// Forms

(function() {
  window.addEventListener('load', function() {
    var forms = document.getElementsByClassName('needs-validation');
    var validation = Array.prototype.filter.call(forms, function(form) {
      form.addEventListener('submit', function(event) {
        if (form.checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      }, false);
    });
  }, false);
})();


// Interest Calculator

(function() {
  window.addEventListener('load', function() {
    var forms = document.getElementsByClassName('interest-calculator');
    var validation = Array.prototype.filter.call(forms, function(form) {
      var initialInvestmentAmount = form.querySelector('[name="initial-investment-amount"]');
      var expectedInterestRate = form.querySelector('[name="expected-interest-rate"]');
      var periodicInvestment = form.querySelector('[name="periodic-investment"]');
      var howOften = form.querySelector('[name="how-often"]');
      var yearsInvested = form.querySelector('[name="years-invested"]');
      var yourFederalTaxRate = form.querySelector('[name="your-federal-tax-rate"]');
      var preTax = form.querySelector('.pre-tax');
      var postTax = form.querySelector('.post-tax');
      function calculateResult(withoutTaxes) {
        var netRateOfReturn = parseFloat(expectedInterestRate.value)*(withoutTaxes?1:1-parseInt(yourFederalTaxRate.value)/100);
        var rateOfReturnPerCycle = netRateOfReturn/12;
        var compoundIterations = 12*parseInt(yearsInvested.value);
        var initialGrowth = parseFloat(initialInvestmentAmount.value)*Math.pow(1+rateOfReturnPerCycle,compoundIterations);
        var periodicGrowth = parseFloat(periodicInvestment.value)*(parseFloat(howOften.value)/12)*(Math.pow(1+rateOfReturnPerCycle,compoundIterations)-1)/rateOfReturnPerCycle;
        return (Math.round((initialGrowth+periodicGrowth)*100)/100).toLocaleString('en-US', {style: 'currency', currency: 'USD'});
      }
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        event.stopPropagation();
        if (form.checkValidity() !== false) {
          form.classList.add('was-validated');
          preTax.innerText = calculateResult(true);
          postTax.innerText = calculateResult();
        }
      }, false);
      preTax.innerText = calculateResult(true);
      postTax.innerText = calculateResult();
    });
  }, false);
})();


// Log In — account-number authentication has been replaced with email/password.
// The homepage login box no longer requires or displays an account number for access.
