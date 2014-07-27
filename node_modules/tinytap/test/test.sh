cat colony.tap | node ../src/runner.js - > out.tap
cat out.tap | node ../src/runner.js - > out2.tap
diff out.tap out2.tap
rm out.tap
rm out2.tap
