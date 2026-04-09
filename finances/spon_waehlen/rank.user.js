// ==UserScript==
// @name         OnlineFussballManager: Sponsor – Ranking
// @namespace    https://github.com/schipa
// @version      1.0.0
// @description  Errechnet ein Ranking der Sponsorenangebote anhand erwarteter Siege und Ligaergebnis.
// @author       schipa
// @match        https://www.onlinefussballmanager.de/finances/spon_waehlen.php*
// @icon         https://www.onlinefussballmanager.de/favicon.ico
// @homepageURL  https://github.com/schipa/ofm-user-scripts
// @downloadURL  https://raw.githubusercontent.com/schipa/ofm-user-scripts/refs/heads/main/finances/spon_waehlen/rank.user.js
// @updateURL    https://raw.githubusercontent.com/schipa/ofm-user-scripts/refs/heads/main/finances/spon_waehlen/rank.user.js
// @grant        none
// ==/UserScript==

;(function () {
    'use strict'

    const WRAPPER_SELECTOR = '#sponsor'
    const SPONSORS_SELECTOR = 'form > div.sponsor-map'

    const EXPECTED_WINS_KEY = 'schipa.finances.spon_waehlen.rank.expectedWins'
    const DIVISION_RESULT_KEY = 'schipa.finances.spon_waehlen.rank.divisionResult'

    const sponsors = getSponsors()
    addForm()

    // FUNCTIONS

    function addForm() {
        let expectedWins = localStorage.getItem(EXPECTED_WINS_KEY)
        if (expectedWins == null) {
            expectedWins = '17'
            localStorage.setItem(EXPECTED_WINS_KEY, expectedWins)
        }

        let divisionResult = localStorage.getItem(DIVISION_RESULT_KEY)
        if (divisionResult == null) {
            divisionResult = 'stay'
            localStorage.setItem(DIVISION_RESULT_KEY, divisionResult)
        }

        const form = document.createElement('div')
        form.style.position = 'absolute'
        form.style.width = '100%'
        form.style.top = '-30px'
        form.style.display = 'flex'
        form.style.justifyContent = 'space-evenly'

        form.innerHTML = `
            <div>
                <label for="expected_wins">Erwartete Siege</label>
                <select name="expected_wins" id="expected_wins" style="text-align: center; width: 4rem;">
                    ${[...Array(35).keys()].map((i) => `<option value="${i}" ${expectedWins === i.toString() ? 'selected' : ''}>${i}</option>`).join('')}
                </select>
            </div>
            <div>
                <input type="radio" name="division_result" id="promotion" value="promotion" ${divisionResult === 'promotion' ? 'checked' : ''}>
                <label for="promotion">Aufstieg</label>
                <input type="radio" name="division_result" id="stay" value="stay" ${divisionResult === 'stay' ? 'checked' : ''}>
                <label for="stay">Klassenerhalt</label>
                <input type="radio" name="division_result" id="relegation" value="relegation" ${divisionResult === 'relegation' ? 'checked' : ''}>
                <label for="relegation">Abstieg</label>
            </div>
        `

        const wrapper = document.querySelector(WRAPPER_SELECTOR)
        wrapper.prepend(form)

        form.querySelector('#expected_wins').addEventListener('change', (event) => {
            const value = event.target.value
            localStorage.setItem(EXPECTED_WINS_KEY, value)
            onFormChange()
        })

        form.querySelectorAll('input[name="division_result"]').forEach((input) =>
            input.addEventListener('change', (event) => {
                const value = event.target.value
                localStorage.setItem(DIVISION_RESULT_KEY, value)
                onFormChange()
            })
        )

        updateRanking(expectedWins, divisionResult)
    }

    function formatCurrency(value) {
        const intl = Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            trailingZeroDisplay: 'stripIfInteger',
        })
        return intl.format(value)
    }

    function getStyleByRank(rank) {
        let backgroundColor = '#000000'
        let color = '#ffffff'
        switch (rank) {
            case 1:
                backgroundColor = '#ffd700'
                color = '#000000'
                break
            case 2:
                backgroundColor = '#c0c0c0'
                color = '#000000'
                break
            case 3:
                backgroundColor = '#cd7f32'
                color = '#ffffff'
                break
        }
        return { backgroundColor, color }
    }

    function getSponsors() {
        const list = document.querySelector(WRAPPER_SELECTOR).querySelectorAll(SPONSORS_SELECTOR)
        return Array.from(list).map((element) => {
            const data = element.querySelectorAll(':scope > div')
            return {
                name: data[0].innerText,
                gameBonus: parseGermanFloat(data[2].innerText),
                winBonus: parseGermanFloat(data[3].innerText),
                promotionBonus: parseGermanFloat(data[4].innerText),
                stayBonus: parseGermanFloat(data[5].innerText),
            }
        })
    }

    function onFormChange() {
        const expectedWins = localStorage.getItem(EXPECTED_WINS_KEY)
        const divisionResult = localStorage.getItem(DIVISION_RESULT_KEY)
        updateRanking(expectedWins, divisionResult)
    }

    function parseGermanFloat(string) {
        return parseFloat(string.replace(/\./g, '').replace(',', '.'))
    }

    function updateRanking(expectedWins, divisionResult) {
        const sortedSponsors = sponsors
            .map((sponsor, elementIndex) => {
                const expectedEarnings =
                    34 * sponsor.gameBonus +
                    expectedWins * sponsor.winBonus +
                    (divisionResult == 'promotion' ? sponsor.promotionBonus : 0) +
                    (divisionResult != 'relegation' ? sponsor.stayBonus : 0)
                return { elementIndex, expectedEarnings }
            })
            .sort((a, b) => b.expectedEarnings - a.expectedEarnings)

        const list = document.querySelector(WRAPPER_SELECTOR).querySelectorAll(SPONSORS_SELECTOR)
        sortedSponsors.forEach(({ elementIndex, expectedEarnings }, rank) => {
            rank += 1

            const nameElement = list[elementIndex].querySelector(':scope > div:first-child')

            let rankElement = nameElement.querySelector('.rank')
            if (rankElement == null) {
                rankElement = document.createElement('abbr')
                rankElement.classList.add('rank')
                rankElement.style.borderRadius = '4px'
                rankElement.style.fontWeight = 'normal'
                rankElement.style.marginRight = '4px'
                rankElement.style.paddingInline = '2px'
                nameElement.prepend(rankElement)
            }

            const style = getStyleByRank(rank)
            rankElement.style.backgroundColor = style.backgroundColor
            rankElement.style.color = style.color
            rankElement.innerText = `#${rank}`
            rankElement.title = `Erwartete Einnahmen: ${formatCurrency(expectedEarnings)}`
        })
    }
})()
