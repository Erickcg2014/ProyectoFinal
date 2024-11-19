// Datos del usuario y del reto
const userData = {
    phoneNumber: "3208882139",
    email: "VeronicaGut@gmail.com",
    name: "Veronica Gutierrez",
    area: "Innovación",
    challengeDate: "27 de agosto, 2024",
    location: "Bogotá",
    targetArea: "Innovación",
    submittedChallenges: 10,
    challengesInProgress: 2,
    implementedSolutions: 4,
    averageImpact: "Media",
    challengeDescription: "Los servicios actuales en la sede de Bucaramanga están siendo muy costosos, por lo que tenemos que realizar una solución lo más pronto posible.",
    challengeBenefits: "Podemos reducir costos de gran manera y optimizar de una manera efectiva los gastos que se hace diariamente."
  };
  
  // Asignar los valores a los elementos HTML
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('user-phone-number').textContent = userData.phoneNumber;
    document.getElementById('user-email').textContent = userData.email;
    document.getElementById('user-name').textContent = userData.name;
    document.getElementById('user-area').textContent = userData.area;
    document.getElementById('challenge-date').textContent = userData.challengeDate;
    document.getElementById('challenge-location').textContent = userData.location;
    document.getElementById('target-area').textContent = userData.targetArea;
    document.getElementById('submitted-challenges').textContent = userData.submittedChallenges;
    document.getElementById('challenges-in-progress').textContent = userData.challengesInProgress;
    document.getElementById('implemented-solutions').textContent = userData.implementedSolutions;
    document.getElementById('average-impact').textContent = userData.averageImpact;
    document.getElementById('challenge-description').textContent = userData.challengeDescription;
    document.getElementById('challenge-benefits').textContent = userData.challengeBenefits;
  });
  