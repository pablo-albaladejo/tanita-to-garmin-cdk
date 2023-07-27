#!/bin/bash

# Root directory where the subdirectories are located
root_directory="src/lambdas/java"

# Check if the root directory exists
if [ ! -d "$root_directory" ]; then
  echo "Root directory does not exist: $root_directory"
  exit 1
fi

# Loop to iterate through all subdirectories and run "mvn package"
for subdirectory in "$root_directory"/*; do
  if [ -d "$subdirectory" ]; then
    echo "Running 'mvn package' on: $subdirectory"
    # Change to the project directory and run "mvn package"
    (cd "$subdirectory" && mvn package)
    echo "Finished 'mvn package' on: $subdirectory"
  fi
done