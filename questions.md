# Key Questions:

1. How to calculate the interest level, what are the thresholds?
2. How do I add dependency between front and backend? Ex: hitting an endpoint could show interest in where that endpoint is called, but it often doesn't come in the form of an import statement
3. Should the weight of a folder be the max of the weights of its children or the total?

# Ideas:

1. Only show files with high interest/mid or higher interest, etc (hide the files that are not interesting enough)
2. Track interest on a function-level
3. People found timelines generally more useful than DOI trees. There already is one in VSCode by default.
4. May need to represent files using some ID's instead of by filePaths
   - This would make it easier to change names/locations.
   - Ex: If src/graph.ts is ID 1, instead of changing every edge that has graph.ts, I can just change ID 1 to the renamed file path

# Todos:

1. Need to find the right threshold so as not to cause too much noise
2. Need to make sure the new file explorer can also have the functionalities of a normal file explorer.
3. Try adding a refresh button to get an idea of how to add buttons.
4. Handle deleting files and import statements
5. Create separate filters for weight, and 1-depth weight? reduce noise
6. Create a connected files tab, which shows the list of files that are neighbors of the currently opened file
   - They should be sorted by weight.
