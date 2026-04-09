// ==UserScript==
// @name         OnlineFussballManager: Transfermarkt – AWP Anzeige
// @namespace    https://github.com/schipa
// @version      1.0.1
// @description  Zeigt die AWP und die Differenz zur nächsten Stärke auf dem Transfermarkt an.
// @author       schipa
// @match        https://www.onlinefussballmanager.de/transfer/transfermarkt.php*
// @icon         https://www.onlinefussballmanager.de/favicon.ico
// @homepageURL  https://github.com/schipa/ofm-user-scripts
// @downloadURL  https://raw.githubusercontent.com/schipa/ofm-user-scripts/refs/heads/main/transfer/fransfermarkt/awp.user.js
// @updateURL    https://raw.githubusercontent.com/schipa/ofm-user-scripts/refs/heads/main/transfer/fransfermarkt/awp.user.js
// @grant        none
// ==/UserScript==

;(function () {
    'use strict'

    const TABLE_SELECTOR = 'table.content_table2'

    const HEAD_SELECTOR = 'tr:first-child'
    const ROW_SELECTOR = 'tr:not(:first-child)'

    const CELL_EPTP_SELECTOR = 'td:nth-of-type(6)'
    const CELL_ST_SELECTOR = 'td:nth-of-type(5)'

    // prettier-ignore
    const AWP_LOWER_BOUNDS = [
        0, 168, 378, 735, 1239, 1974, 2751, 3570, 4452, 5376,
        6342, 7350, 8400, 9502, 10658, 11865, 13125, 14438, 15802, 17199,
        18543, 19856, 21136, 22396, 23656, 25310, 27003, 28736, 30509, 32322,
        34175, 36068, 38000,
    ]

    const COLOR_RED = '#995141'
    const COLOR_GREEN = '#00980c'

    const table = getResultTable()
    tamperHead(table)
    tamperRows(table)

    // FUNCTIONS

    function harmonicMeanRounded(array) {
        let reciprocalSum = 0
        array.forEach((i) => {
            reciprocalSum += 1 / i
        })

        const mean = array.length / reciprocalSum
        return Math.round(mean)
    }

    function getResultTable() {
        return document.querySelector(TABLE_SELECTOR)
    }

    function tamperHead(table) {
        if (!(table instanceof Document)) {
            return
        }

        const headCell = table.querySelector(HEAD_SELECTOR).querySelector(CELL_EPTP_SELECTOR)
        const awpText = headCell.querySelector('& > span').cloneNode()
        awpText.innerHTML = '<br>AWP'
        headCell.appendChild(awpText)
    }

    function tamperRows(table) {
        if (!(table instanceof Document)) {
            return
        }

        const rows = table.querySelectorAll(ROW_SELECTOR)
        rows.forEach(tamperRow)
    }

    function tamperRow(row) {
        const st = getSt(row)
        const eptp = getEpTp(row)
        const awp = harmonicMeanRounded(eptp)
        const awpDiff = getAwpDiff(st, awp)
        const diffColor = awpDiff < 0 ? COLOR_RED : COLOR_GREEN

        let appendHTML = '<br>'
        appendHTML += `<span class="bold">${format(awp)}</span> `
        appendHTML += `<span style="color: ${diffColor}; font-size: 9px;">Diff.: ${format(awpDiff)}</span>`

        const eptpCell = row.querySelector(CELL_EPTP_SELECTOR)
        eptpCell.innerHTML += appendHTML
    }

    function getEpTp(row) {
        const cell = row.querySelector(CELL_EPTP_SELECTOR)
        return cell.textContent.split(/\s*\/\s*/).map((s) => parseInt(s.replace('.', '')))
    }

    function getSt(row) {
        const cell = row.querySelector(CELL_ST_SELECTOR)
        return parseInt(cell.textContent)
    }

    function getAwpDiff(st, awp) {
        const nextBound = AWP_LOWER_BOUNDS[st]
        return awp - nextBound
    }

    function format(number) {
        return Intl.NumberFormat().format(number)
    }
})()
