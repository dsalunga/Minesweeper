plugins {
    kotlin("jvm") version "2.0.0"
}

group = "org.minesweeper"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    testImplementation(kotlin("test"))

    implementation(kotlin("stdlib"))

    // Test dependencies
    testImplementation("org.junit.jupiter:junit-jupiter-api:5.11.0") // Check for the latest version
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.11.0")
    testImplementation("org.junit.jupiter:junit-jupiter-params:5.11.0")
}

tasks.test {
    useJUnitPlatform()
}