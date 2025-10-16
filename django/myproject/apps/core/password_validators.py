import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

class LetterAndDigitValidator:
    def validate(self, password, user=None):
        if not re.search(r'[A-Za-z]', password) or not re.search(r'\d', password):
            raise ValidationError(
                _("Пароль должен содержать хотя бы одну букву и одну цифру."),
                code='password_no_letter_or_digit',
            )

    def get_help_text(self):
        return _(
            "Ваш пароль должен содержать хотя бы одну букву и одну цифру."
        ) 