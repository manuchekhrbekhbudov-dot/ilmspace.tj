import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from lib import export
import w1, w2, w3, w4  # noqa  — масъалаҳои асосӣ (10 дар рӯз)
import importlib
for m in ('x1', 'x2', 'x3', 'x4'):  # масъалаҳои иловагӣ: то 30 дар рӯз ва 30 дар имтиҳон
    if os.path.exists(os.path.join(os.path.dirname(__file__), m + '.py')):
        importlib.import_module(m)
export(os.path.join(os.path.dirname(__file__), '..', 'server', 'seed', 'course.json'))
