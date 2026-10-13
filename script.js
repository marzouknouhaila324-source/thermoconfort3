/* ==========================================
   THERMOCONFORT
   Système d'inférence floue
========================================== */

/* 1. Récupération des éléments HTML */
const temperatureInput = document.getElementById("temperature");
const humiditeInput = document.getElementById("humidite");
const temperatureRange = document.getElementById("temperature-range");
const humiditeRange = document.getElementById("humidite-range");
const evaluerButton = document.getElementById("evaluer");

/* 2. Fonctions d'appartenance de la température */

function temperatureFroide(t) {
    if (t <= 10) return 1;
    if (t >= 20) return 0;
    return (20 - t) / 10;
}

function temperatureModeree(t) {
    if (t <= 15 || t >= 30) return 0;
    if (t <= 22.5) return (t - 15) / 7.5;
    return (30 - t) / 7.5;
}

function temperatureChaude(t) {
    if (t <= 25) return 0;
    if (t >= 35) return 1;
    return (t - 25) / 10;
}

/* 3. Fonctions d'appartenance de l'humidité */

function humiditeFaible(h) {
    if (h <= 20) return 1;
    if (h >= 40) return 0;
    return (40 - h) / 20;
}

function humiditeMoyenne(h) {
    if (h <= 30 || h >= 70) return 0;
    if (h <= 50) return (h - 30) / 20;
    return (70 - h) / 20;
}

function humiditeElevee(h) {
    if (h <= 60) return 0;
    if (h >= 80) return 1;
    return (h - 60) / 20;
}

function limiter(valeur) {
    return Math.max(0, Math.min(1, valeur));
}

/* 4. Base des 9 règles floues
   ET = MIN
   Agrégation = MAX
*/
function appliquerRegles(froide, moderee, chaude, faible, moyenne, elevee) {

    // R1 : Froide ET Faible => Mauvais
    const R1 = Math.min(froide, faible);

    // R2 : Froide ET Moyenne => Mauvais
    const R2 = Math.min(froide, moyenne);

    // R3 : Froide ET Élevée => Mauvais
    const R3 = Math.min(froide, elevee);

    // R4 : Modérée ET Faible => Moyen
    const R4 = Math.min(moderee, faible);

    // R5 : Modérée ET Moyenne => Bon
    const R5 = Math.min(moderee, moyenne);

    // R6 : Modérée ET Élevée => Moyen
    const R6 = Math.min(moderee, elevee);

    // R7 : Chaude ET Faible => Mauvais
    const R7 = Math.min(chaude, faible);

    // R8 : Chaude ET Moyenne => Mauvais
    const R8 = Math.min(chaude, moyenne);

    // R9 : Chaude ET Élevée => Mauvais
    const R9 = Math.min(chaude, elevee);

    return {
        mauvais: Math.max(R1, R2, R3, R7, R8, R9),
        moyen: Math.max(R4, R6),
        bon: R5
    };
}

/* 5. Ensembles flous de sortie sur une échelle de 0 à 100
   Mauvais : épaule gauche
   Moyen   : triangle
   Bon     : épaule droite
*/

function sortieMauvais(x) {
    if (x <= 20) return 1;
    if (x >= 40) return 0;
    return (40 - x) / 20;
}

function sortieMoyen(x) {
    if (x <= 30 || x >= 70) return 0;
    if (x <= 50) return (x - 30) / 20;
    return (70 - x) / 20;
}

function sortieBon(x) {
    if (x <= 60) return 0;
    if (x >= 80) return 1;
    return (x - 60) / 20;
}

/* 6. Défuzzification par le centre de gravité */

function calculerScore(mauvais, moyen, bon) {
    const pas = 0.5;
    let sommeMoments = 0;
    let sommeAppartenances = 0;

    for (let x = 0; x <= 100; x += pas) {
        const muMauvais = Math.min(mauvais, sortieMauvais(x));
        const muMoyen = Math.min(moyen, sortieMoyen(x));
        const muBon = Math.min(bon, sortieBon(x));

        const muAgregee = Math.max(
            muMauvais,
            muMoyen,
            muBon
        );

        sommeMoments += x * muAgregee;
        sommeAppartenances += muAgregee;
    }

    if (sommeAppartenances === 0) return 0;

    return Math.round(sommeMoments / sommeAppartenances);
}

/* 7. Affichage des degrés d'appartenance */

function afficherValeur(id, valeur) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = valeur.toFixed(2);
    }
}

function mettreAJourBarre(id, valeur) {
    const element = document.getElementById(id);

    if (element) {
        element.style.width = `${limiter(valeur) * 100}%`;
    }
}

function afficherCategorie(nom, valeur) {
    afficherValeur(`${nom}-value`, valeur);
    mettreAJourBarre(`${nom}-bar`, valeur);
}

/* 8. Interprétation du score
   0–40   : confort faible
   41–70  : confort moyen
   71–100 : confort élevé
*/

function afficherInterpretation(score) {
    const label = document.getElementById("comfort-label");
    const description = document.getElementById("result-description");
    const houseTitle = document.getElementById("house-title");
    const houseMessage = document.getElementById("house-message");
    const adviceTitle = document.getElementById("advice-title");
    const advice = document.getElementById("advice");

    if (score <= 40) {
        label.textContent = "Confort faible";
        description.textContent =
            "Les conditions thermiques sont peu confortables.";

        houseTitle.textContent = "Un environnement à améliorer";
        houseMessage.textContent =
            "La température ou l'humidité peut réduire le confort.";

        adviceTitle.textContent = "Améliorer le confort";
        advice.textContent =
            "Adaptez la température de la pièce et vérifiez l'humidité pour améliorer le confort.";

    } else if (score <= 70) {
        label.textContent = "Confort moyen";
        description.textContent =
            "Les conditions peuvent être améliorées.";

        houseTitle.textContent = "Un confort perfectible";
        houseMessage.textContent =
            "Quelques ajustements peuvent rendre l'environnement plus agréable.";

        adviceTitle.textContent = "Ajuster les conditions";
        advice.textContent =
            "Essayez de rapprocher la température et l'humidité de valeurs plus confortables.";

    } else {
        label.textContent = "Confort élevé";
        description.textContent =
            "Les conditions estimées sont favorables au confort.";

        houseTitle.textContent = "Un environnement confortable";
        houseMessage.textContent =
            "Une température agréable et une humidité équilibrée favorisent le bien-être.";

        adviceTitle.textContent = "Maintenir le confort";
        advice.textContent =
            "Maintenez des conditions adaptées et aérez la pièce si nécessaire.";
    }
}

/* 9. Fonction principale d'évaluation */

function evaluerConfort() {
    const texteTemperature = temperatureInput.value.trim();
    const texteHumidite = humiditeInput.value.trim();

    if (texteTemperature === "" || texteHumidite === "") {
        alert("Veuillez saisir des valeurs numériques valides.");
        return;
    }

    const temperature = Number(texteTemperature);
    const humidite = Number(texteHumidite);

    if (!Number.isFinite(temperature) ||
        !Number.isFinite(humidite)) {
        alert("Veuillez saisir des valeurs numériques valides.");
        return;
    }

    if (temperature < 0 || temperature > 40) {
        alert("La température doit être comprise entre 0 °C et 40 °C.");
        return;
    }

    if (humidite < 0 || humidite > 100) {
        alert("L'humidité doit être comprise entre 0 % et 100 %.");
        return;
    }

    /* Étape 1 : Fuzzification */

    const froide = temperatureFroide(temperature);
    const moderee = temperatureModeree(temperature);
    const chaude = temperatureChaude(temperature);

    const faible = humiditeFaible(humidite);
    const moyenne = humiditeMoyenne(humidite);
    const elevee = humiditeElevee(humidite);

    afficherCategorie("froide", froide);
    afficherCategorie("moderee", moderee);
    afficherCategorie("chaude", chaude);

    afficherCategorie("faible", faible);
    afficherCategorie("moyenne", moyenne);
    afficherCategorie("elevee", elevee);

    /* Étape 2 : Application des règles et agrégation */

    const resultat = appliquerRegles(
        froide,
        moderee,
        chaude,
        faible,
        moyenne,
        elevee
    );

    afficherCategorie("mauvais", resultat.mauvais);
    afficherCategorie("moyen", resultat.moyen);
    afficherCategorie("bon", resultat.bon);

    /* Étape 3 : Défuzzification */

    const score = calculerScore(
        resultat.mauvais,
        resultat.moyen,
        resultat.bon
    );

    document.getElementById("score").textContent = score;

    mettreAJourBarre("score-progress", score / 100);

    afficherInterpretation(score);
}

/* 10. Synchronisation des champs et des curseurs */

temperatureInput.addEventListener("input", function () {
    if (temperatureInput.value !== "") {
        temperatureRange.value = temperatureInput.value;
    }
});

temperatureRange.addEventListener("input", function () {
    temperatureInput.value = temperatureRange.value;
});

humiditeInput.addEventListener("input", function () {
    if (humiditeInput.value !== "") {
        humiditeRange.value = humiditeInput.value;
    }
});

humiditeRange.addEventListener("input", function () {
    humiditeInput.value = humiditeRange.value;
});

/* 11. Lancement de l'évaluation */

evaluerButton.addEventListener("click", evaluerConfort);

evaluerConfort();
