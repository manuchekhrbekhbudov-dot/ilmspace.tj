import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from lib import export
import w1, w2, w3, w4  # noqa
export(os.path.join(os.path.dirname(__file__), '..', 'server', 'seed', 'course.json'))
