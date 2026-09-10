import os

# The full hyperparameter grid makes the model tests roughly twenty times
# slower, so the suite runs against the trimmed one. Setting this here rather
# than asking the developer to export it by hand keeps the two uses apart: a
# "fast" left behind in a shell session would otherwise leak into a real
# training run and quietly tune the shipped model over a fraction of the grid.
# setdefault, so an explicit TUNING_PROFILE=full still wins for a slow, thorough run.
os.environ.setdefault("TUNING_PROFILE", "fast")
