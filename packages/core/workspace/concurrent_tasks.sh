#!/bin/bash

start_time=$(date +%s.%N)

# 1) Create 5 different files simultaneously
for i in {1..5}; do
  echo "File $i content" > file$i.txt &
done
wait

# 2) Read multiple files in parallel
for i in {1..5}; do
  cat file$i.txt &
done
wait

# 3) Execute parallel shell commands
(sleep 1 && echo "Command 1 done") &
(sleep 0.5 && echo "Command 2 done") &
(sleep 1.5 && echo "Command 3 done") &
wait

end_time=$(date +%s.%N)

runtime=$(echo "$end_time - $start_time" | bc)

echo "\n--- Performance Report ---"
echo "Total execution time: ${runtime} seconds"
