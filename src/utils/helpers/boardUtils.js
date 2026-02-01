import { errorTypes } from '../errors.js';

function assertBoardOwnership(board, ownerId) {
    if (!board) {
        throw errorTypes.notFound('Board not found');
    }

    if (String(board.ownerUserId) !== String(ownerId)) {
        throw errorTypes.forbidden();
    }
}

function buildBoardColumns(rows) {
    const columnsMap = new Map();

    rows.forEach((row) => {
        if (!columnsMap.has(row.columnId)) {
            columnsMap.set(row.columnId, {
                id: row.columnId,
                name: row.columnName,
                position: row.columnPosition,
                cards: [],
            });
        }

        if (row.cardId) {
            columnsMap.get(row.columnId).cards.push({
                id: row.cardId,
                title: row.cardTitle,
                description: row.cardDescription,
                position: row.cardPosition,
                createdAt: row.cardCreatedAt,
                updatedAt: row.cardUpdatedAt,
            });
        }
    });

    const columns = Array.from(columnsMap.values()).sort((a, b) => a.position - b.position);
    columns.forEach((col) => col.cards.sort((a, b) => a.position - b.position));

    return columns;
}

export {
    assertBoardOwnership,
    buildBoardColumns
};
