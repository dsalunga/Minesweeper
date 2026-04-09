package unittests

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import org.minesweeper.engine.Point

internal class PointTests {

    @ParameterizedTest
    @CsvSource("A1, 5, 0, 0", "B2, 5, 1, 1", "E5, 5, 4, 4")
    fun `TryParse valid input returns Point`(input: String?, gridSize: Int, expectedRow: Int, expectedCol: Int) {
        // Act
        val result = Point.tryParse(input, gridSize)

        // Assert
        assertNotNull(result)
        assertAll("result",
            { assertEquals(expectedRow, result?.row) },
            { assertEquals(expectedCol, result?.col) }
        )
    }

    @ParameterizedTest
    @CsvSource("null, 5", ", 5", "A, 5", "A11, 5", "F1, 5", "A6, 5", delimiter = ',')
    fun `TryParse invalid input returns null`(input: String?, gridSize: Int) {
        // Act
        val result = Point.tryParse(input, gridSize)

        // Assert
        assertNull(result)
    }
}